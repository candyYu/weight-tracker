import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { fuzzyMatch, lookupKcal } from '../foods'
import VisionModal from './VisionModal'

const MEAL_LABEL: Record<string, string> = {
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐',
}

export default function MealPage() {
  const today = new Date().toISOString().slice(0, 10)
  const meals = useLiveQuery(() => db.meals.where('date').equals(today).toArray(), [today]) ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [showOcr, setShowOcr] = useState(false)
  const [showVision, setShowVision] = useState(false)

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
        <button className="btn secondary" onClick={() => setShowVision(true)}>🤖 AI 视觉</button>
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
      {showVision && <VisionModal onClose={() => setShowVision(false)} date={today} onSaved={() => setShowVision(false)} />}
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
  const [step, setStep] = useState<'pick' | 'confirm'>('pick')
  const [recognized, setRecognized] = useState<string[]>([])
  const [candidates, setCandidates] = useState<Array<{ food: string; kcal: number; score: number }>>([])
  const [picked, setPicked] = useState<Array<{ food: string; grams: number; kcal: number }>>([])

  // OCR 状态
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [progressLabel, setProgressLabel] = useState<string>('')
  const [manualText, setManualText] = useState<string>('')

  async function handleFile(file: File) {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    const startTime = Date.now()
    const tick = () => {
      const sec = Math.floor((Date.now() - startTime) / 1000)
      setProgressLabel(prev => prev.includes('%') ? prev : `${prev} · 已用 ${sec}s`)
    }
    const timer = setInterval(tick, 500)
    setProgressLabel('加载识别引擎...')
    setProgress(0)
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(['chi_sim', 'eng'], 1, {
        logger: m => {
          tick()
          if (m.status === 'recognizing text') {
            const p = Math.round(m.progress * 100)
            setProgress(p)
            const sec = Math.floor((Date.now() - startTime) / 1000)
            setProgressLabel(`识别中 ${p}% · 已用 ${sec}s`)
          } else {
            setProgressLabel(translateStatus(m.status))
          }
        },
      })
      setProgressLabel('识别中...')
      const { data } = await worker.recognize(url)
      clearInterval(timer)
      await worker.terminate()
      const text = (data.text || '').trim()
      if (!text) {
        setProgressLabel('未识别到文字,试试手输或换张更清晰的图')
        return
      }
      setManualText(text)
      parseText(text)
    } catch (err) {
      clearInterval(timer)
      setProgressLabel('识别失败: ' + (err as Error).message)
    }
  }

  function parseText(text: string) {
    const lines = text.split(/[\n,，]/).map(l => l.trim()).filter(Boolean)
    const items: string[] = []
    const cands: Array<{ food: string; kcal: number; score: number }> = []
    for (const line of lines) {
      const match = line.match(/^(.+?)\s*(\d+)?g?$/i)
      if (!match) continue
      const raw = match[1]
      const name = (raw || '').trim()
      if (!name) continue  // 跳过空行
      items.push(name)
      const results = fuzzyMatch(name)
      cands.push(results[0] || { food: name, kcal: 0, score: 0 })
    }
    setRecognized(items)
    setCandidates(cands)
    // 初始化 picked 默认 100g
    setPicked(items.map(name => {
      const info = lookupKcal(name)
      return { food: name, grams: 100, kcal: info ? info.kcal : 0 }
    }))
    setStep('confirm')
  }

  function reparse() {
    if (manualText.trim()) parseText(manualText)
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
    if (imgUrl) URL.revokeObjectURL(imgUrl)
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>📷 餐食记录</h3>
        {step === 'pick' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              拍食物标签/包装上的字,或从相册选,App 会本机识别并匹配食物库。
              拍不清可直接粘贴/输入文字。
            </p>

            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <label className="btn" style={{ flex: 1, margin: 0 }}>
                📷 拍照
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
              </label>
              <label className="btn secondary" style={{ flex: 1, margin: 0 }}>
                🖼️ 相册
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
              </label>
            </div>

            {imgUrl && progressLabel && (
              <div style={{ margin: '12px 0', padding: 10, background: 'var(--bg)', borderRadius: 8 }}>
                <img src={imgUrl} alt="待识别" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{progressLabel}</div>
                {progress > 0 && progress < 100 && (
                  <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--pink)', transition: 'width 0.2s' }} />
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', fontSize: 12, color: 'var(--muted)' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span>或手输文字</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>

            <textarea
              rows={4}
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="米饭 200g&#10;苹果&#10;西红柿炒蛋 150g"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={reparse}>
              解析
            </button>
          </>
        )}
        {step === 'confirm' && (
          <>
            <p style={{ fontSize: 13 }}>识别到 {recognized.length} 项,逐个确认:</p>
            {recognized.map((name, idx) => {
              const safeName = name || '(空)'
              const info = lookupKcal(safeName)
              const cur = picked[idx] || { food: safeName, grams: 100, kcal: 0 }
              return (
                <div key={idx} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>原文: <b>{safeName}</b></div>
                  {info ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13 }}>→ {safeName}</span>
                      <input type="number" defaultValue={cur.grams} style={{ width: 80 }} onChange={e => {
                        const g = +e.target.value || 0
                        setPicked(p => {
                          const cp = [...p]
                          cp[idx] = { food: safeName, grams: g, kcal: Math.round(info.kcal * g / 100) }
                          return cp
                        })
                      }} />
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>g</span>
                      <span style={{ fontSize: 13, color: 'var(--pink-deep)', marginLeft: 'auto' }}>
                        {cur.kcal} kcal
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      库里没找到 "{safeName}",可手动改名
                      <input
                        type="text"
                        style={{ width: '100%', marginTop: 4, boxSizing: 'border-box' }}
                        defaultValue={safeName}
                        onChange={e => {
                          const newName = e.target.value
                          const newInfo = lookupKcal(newName)
                          setPicked(p => {
                            const cp = [...p]
                            cp[idx] = { food: newName, grams: cur.grams, kcal: newInfo ? Math.round(newInfo.kcal * cur.grams / 100) : 0 }
                            return cp
                          })
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            <button className="btn" style={{ marginTop: 16, width: '100%' }} onClick={save} disabled={picked.length === 0}>
              保存到今日
            </button>
            <button className="btn secondary" style={{ marginTop: 8, width: '100%' }} onClick={() => setStep('pick')}>
              ← 重新识别
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function translateStatus(s: string): string {
  const map: Record<string, string> = {
    'loading tesseract core': '加载识别引擎...',
    'initializing tesseract': '初始化...',
    'loading language traineddata': '下载中文模型 (首次 5MB)...',
    'initializing api': '准备 API...',
    'recognizing text': '识别中...',
  }
  return map[s] || s
}
