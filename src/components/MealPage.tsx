import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { fuzzyMatch, lookupKcal } from '../foods'

const MEAL_LABEL: Record<string, string> = {
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐',
}

export default function MealPage() {
  const today = new Date().toISOString().slice(0, 10)
  const meals = useLiveQuery(() => db.meals.where('date').equals(today).toArray(), [today]) ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [showOcr, setShowOcr] = useState(false)

  const todayKcal = meals.reduce((s, m) => s + m.totalKcal, 0)

  return (
    <>
      <div className="card">
        <h2>今日 ({today})</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="v">{todayKcal}</div>
            <div className="l">kcal</div>
          </div>
          <div className="stat">
            <div className="v" style={{ fontSize: 20 }}>{meals.length}</div>
            <div className="l">餐次</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn" onClick={() => setShowAdd(true)}>+ 手动记录</button>
        <button className="btn secondary" onClick={() => setShowOcr(true)}>📷 OCR 识别</button>
      </div>

      <div className="card">
        <h2>餐食明细</h2>
        {meals.length === 0 ? (
          <p className="empty">今天还没记录</p>
        ) : (
          meals.map(m => (
            <div className="list-item" key={m.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span className="meal-tag">{MEAL_LABEL[m.meal]}</span>
                  {m.source === 'ocr' && <span className="meal-tag" style={{ background: '#FFF5E6', color: '#F5A623' }}>OCR</span>}
                </div>
                <div style={{ fontWeight: 600 }}>{m.totalKcal} kcal</div>
              </div>
              <div className="meta" style={{ marginTop: 4 }}>
                {m.items.map((i, idx) => (
                  <span key={idx}>{i.food} {i.grams}g · </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && <ManualMealModal onClose={() => setShowAdd(false)} />}
      {showOcr && <OcrModal onClose={() => setShowOcr(false)} />}
    </>
  )
}

function ManualMealModal({ onClose }: { onClose: () => void }) {
  const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [food, setFood] = useState('')
  const [grams, setGrams] = useState('100')

  async function save() {
    if (!food || !grams) return
    const info = lookupKcal(food)
    const g = parseFloat(grams)
    const kcal = info ? Math.round(info.kcal * g / 100) : 0
    await db.meals.add({
      date: new Date().toISOString().slice(0, 10),
      meal,
      items: [{ food, grams: g, kcal }],
      totalKcal: kcal,
      source: 'manual',
      createdAt: Date.now(),
    })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>手动记录</h3>
        <label>餐次</label>
        <select value={meal} onChange={e => setMeal(e.target.value as any)}>
          <option value="breakfast">早餐</option>
          <option value="lunch">午餐</option>
          <option value="dinner">晚餐</option>
          <option value="snack">加餐</option>
        </select>
        <label>食物 (从下方库选或自己填)</label>
        <input value={food} onChange={e => setFood(e.target.value)} placeholder="例: 米饭" autoFocus />
        <label>克数 (g)</label>
        <input type="number" value={grams} onChange={e => setGrams(e.target.value)} />
        <button className="btn" style={{ marginTop: 16 }} onClick={save}>保存</button>
      </div>
    </div>
  )
}

function OcrModal({ onClose }: { onClose: () => void }) {
  const [recognized, setRecognized] = useState<string[]>([])
  const [candidates, setCandidates] = useState<Array<{ food: string; kcal: number; score: number }>>([])
  const [step, setStep] = useState<'pick' | 'confirm'>('pick')
  const [picked, setPicked] = useState<Array<{ food: string; grams: number; kcal: number }>>([])

  // 简化 OCR: 用户手输或粘贴图片中的文字 (浏览器内 Tesseract.js 太重, MVP 暂用手动输入)
  // 这里留了 hook 让用户输入,实际等同于"快速手动"
  const [text, setText] = useState('')

  function parse() {
    // 简单分行:每行 "食物 克数",例: "米饭 200g"
    const lines = text.split(/[\n,，]/).map(l => l.trim()).filter(Boolean)
    const items: string[] = []
    const cands: Array<{ food: string; kcal: number; score: number }> = []
    for (const line of lines) {
      const match = line.match(/^(.+?)\s*(\d+)?g?$/i)
      if (!match) continue
      const name = match[1].trim()
      items.push(name)
      const results = fuzzyMatch(name)
      if (results.length) cands.push(results[0])
    }
    setRecognized(items)
    setCandidates(cands)
    setStep('confirm')
  }

  async function save() {
    if (picked.length === 0) return
    const totalKcal = picked.reduce((s, i) => s + i.kcal, 0)
    await db.meals.add({
      date: new Date().toISOString().slice(0, 10),
      meal: 'lunch',
      items: picked,
      totalKcal,
      source: 'ocr',
      createdAt: Date.now(),
    })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>📷 餐食记录</h3>
        {step === 'pick' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              把你看到/拍到的食物名称按行输入,后接克数(可省略,默认 100g)。
              例:<br />
              米饭 200g<br />
              西红柿炒蛋 150g
            </p>
            <label>食物列表</label>
            <textarea rows={5} value={text} onChange={e => setText(e.target.value)} placeholder="米饭 200g&#10;苹果" autoFocus />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              📌 二期:接入 Tesseract.js 拍照自动识别文字。当前版本手动输入更准。
            </p>
            <button className="btn" style={{ marginTop: 12 }} onClick={parse}>解析</button>
          </>
        )}
        {step === 'confirm' && (
          <>
            <p style={{ fontSize: 13 }}>识别到 {recognized.length} 项,逐个确认:</p>
            {recognized.map((name, idx) => {
              const top = candidates[idx]
              const info = lookupKcal(name)
              return (
                <div key={idx} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>原文: <b>{name}</b></div>
                  {info ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 13 }}>→ {name}</span>
                      <input type="number" defaultValue={100} style={{ width: 80 }} onChange={e => {
                        const g = +e.target.value
                        setPicked(p => {
                          const cp = [...p]
                          cp[idx] = { food: name, grams: g, kcal: Math.round(info.kcal * g / 100) }
                          return cp
                        })
                      }} />
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>g</span>
                      <span style={{ fontSize: 13, color: 'var(--pink-deep)', marginLeft: 'auto' }}>
                        {Math.round(info.kcal * (picked[idx]?.grams ?? 100) / 100)} kcal
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      库里没找到 ({top ? `最像: ${top.food}` : '无候选'}),跳过
                    </div>
                  )}
                </div>
              )
            })}
            <button className="btn" style={{ marginTop: 16 }} onClick={save}>保存全部</button>
          </>
        )}
      </div>
    </div>
  )
}
