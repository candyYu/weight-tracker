import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function WeightPage() {
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? []
  const profile = useLiveQuery(() => db.profile.get('me'))
  const [showAdd, setShowAdd] = useState(false)

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  async function add() {
    if (!weight) return
    await db.weights.put({
      date, weight: parseFloat(weight), note,
      createdAt: Date.now(),
    })
    setWeight(''); setNote(''); setShowAdd(false)
  }

  async function del(id: number) {
    if (confirm('删除这条记录?')) await db.weights.delete(id)
  }

  const chartData = weights.map(w => ({
    date: w.date.slice(5),
    weight: w.weight,
  }))

  return (
    <>
      <div className="card">
        <h2>体重曲线</h2>
        {chartData.length > 1 ? (
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10 }} width={32} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#FF6B9D" strokeWidth={2} dot={{ r: 3 }} />
                {profile?.targetWeight && (
                  <ReferenceLine y={profile.targetWeight} stroke="#4CAF82" strokeDasharray="3 3" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty">至少 2 条记录才能画曲线</p>
        )}
      </div>

      <button className="btn" style={{ marginBottom: 12 }} onClick={() => setShowAdd(true)}>
        + 记录新体重
      </button>

      <div className="card">
        <h2>历史记录 ({weights.length})</h2>
        {weights.length === 0 ? (
          <p className="empty">还没有记录</p>
        ) : (
          [...weights].reverse().map(w => (
            <div className="list-item" key={w.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{w.weight.toFixed(1)} kg</div>
                <div className="meta">{w.date} {w.note && `· ${w.note}`}</div>
              </div>
              <button onClick={() => w.id && del(w.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18 }}>×</button>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="modal-bg" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>记录体重</h3>
            <label>日期</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <label>体重 (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="例: 55.5" autoFocus />
            <label>备注 (可选)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="例: 早起空腹" />
            <button className="btn" style={{ marginTop: 16 }} onClick={add}>保存</button>
          </div>
        </div>
      )}
    </>
  )
}
