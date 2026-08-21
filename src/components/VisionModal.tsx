import { useState, useRef, useEffect } from 'react'
import { db, type MealItem } from '../db'
import { getApiKey, setApiKey, getTodayUsage, getRemaining, DAILY_LIMIT, recognizeFood, type VisionFoodItem } from '../vision'

export default function VisionModal({ onClose, onSaved, date }: { onClose: () => void; onSaved: () => void; date: string }) {
  const [step, setStep] = useState<'setup' | 'pick' | 'confirm'>('pick')
  const [apiKey, setKey] = useState(getApiKey() || '')
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [recognized, setRecognized] = useState<VisionFoodItem[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [usage, setUsage] = useState(getTodayUsage())
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!getApiKey()) {
      setStep('setup')
    }
  }, [])

  async function handleFile(file: File) {
    setImgUrl(URL.createObjectURL(file))
    setBusy(true)
    setErr(null)
    setStep('pick')
    try {
      const items = await recognizeFood(file)
      if (items.length === 0) {
        setErr('未识别到食物,试试换个角度/光线,或手输')
      } else {
        setRecognized(items)
        setStep('confirm')
      }
      setUsage(getTodayUsage())
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (recognized.length === 0) return
    const meal = guessMealType()
    const items: MealItem[] = recognized.map(it => ({ food: it.name, grams: it.grams, kcal: it.kcal }))
    const totalKcal = items.reduce((s, i) => s + i.kcal, 0)
    await db.meals.add({ date, meal, items, totalKcal, source: 'ocr', createdAt: Date.now() })
    onSaved()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>🤖 AI 视觉识别</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {step === 'setup' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              拍真实食物照片(碗里菜/盘子),AI 识别食物名 + 估算克数和热量。<br />
              需阿里云百炼 API key (免费,注册 <a href="https://dashscope.console.aliyun.com" target="_blank" rel="noreferrer" style={{ color: 'var(--pink-deep)' }}>点这里</a>)。<br />
              key 只存在你本地浏览器,不会上传。
            </p>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>阿里云百炼 API key (sk-xxx)</div>
            <input
              type="password"
              value={apiKey}
              onChange={e => setKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxx"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" disabled={!apiKey.trim()} onClick={() => { setApiKey(apiKey); setStep('pick') }}>保存并开始</button>
              <button className="btn secondary" onClick={onClose}>取消</button>
            </div>
          </>
        )}

        {step === 'pick' && (
          <>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              今日已用 <b>{usage}/{DAILY_LIMIT}</b> 次 · 剩余 {getRemaining()} 次
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              拍真实食物照片(碗/盘/杯子),AI 会识别内容并估算克数和热量。
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button className="btn" onClick={() => cameraRef.current?.click()}>📷 拍照</button>
              <button className="btn secondary" onClick={() => fileRef.current?.click()}>🖼️ 相册</button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {imgUrl && <img src={imgUrl} alt="预览" style={{ width: '100%', borderRadius: 8, marginTop: 8 }} />}
            {busy && <p style={{ color: 'var(--pink-deep)' }}>AI 识别中...首次调用约 3-5 秒</p>}
            {err && <p style={{ color: '#c00', fontSize: 13 }}>❌ {err}</p>}
            {!getApiKey() && <button className="btn secondary" onClick={() => setStep('setup')}>设置 API key</button>}
          </>
        )}

        {step === 'confirm' && (
          <>
            <p style={{ fontSize: 13 }}>识别到 <b>{recognized.length}</b> 项,逐项确认:</p>
            {recognized.map((it, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    defaultValue={it.name}
                    onChange={e => {
                      const v = e.target.value
                      setRecognized(rs => rs.map((r, i) => i === idx ? { ...r, name: v } : r))
                    }}
                    style={{ flex: 1, minWidth: 100 }}
                  />
                  <input
                    type="number"
                    defaultValue={it.grams}
                    onChange={e => {
                      const g = +e.target.value || 0
                      setRecognized(rs => rs.map((r, i) => i === idx ? { ...r, grams: g } : r))
                    }}
                    style={{ width: 70 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>g</span>
                  <input
                    type="number"
                    defaultValue={it.kcal}
                    onChange={e => {
                      const k = +e.target.value || 0
                      setRecognized(rs => rs.map((r, i) => i === idx ? { ...r, kcal: k } : r))
                    }}
                    style={{ width: 70 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>kcal</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, fontSize: 13 }}>
              合计: <b style={{ color: 'var(--pink-deep)' }}>{recognized.reduce((s, r) => s + r.kcal, 0)} kcal</b>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={save}>保存到今日</button>
              <button className="btn secondary" onClick={() => { setStep('pick'); setRecognized([]) }}>重拍</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function guessMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours()
  if (h < 10) return 'breakfast'
  if (h < 14) return 'lunch'
  if (h < 17) return 'snack'
  return 'dinner'
}
