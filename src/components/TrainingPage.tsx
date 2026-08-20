import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { getTodayPlan, getTodayKcal, getWeekPlan, type Level, type DayPlan } from '../trainingPlan'
import { getExercisesByScene, type Scene, type Exercise } from '../exercises'

type Tab = 'today' | 'week' | 'library'

function parseDuration(d: string): number {
  if (d.endsWith('s')) return parseInt(d)
  if (d.endsWith('min')) return parseInt(d) * 60
  if (d.includes('次')) return parseInt(d) * 2.5
  return 30
}

function getDayName(dow: number): string {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dow]
}

function intensityLabel(i: 'low' | 'medium' | 'high'): string {
  return { low: '低', medium: '中', high: '高' }[i]
}

function bodyPartLabel(b: string): string {
  const map: Record<string, string> = {
    chest: '胸', back: '背', shoulder: '肩', arms: '手臂',
    legs: '腿', glutes: '臀', core: '核心', cardio: '心肺',
    fullbody: '全身', mobility: '拉伸',
  }
  return map[b] || b
}

function dateOfDay(dow: number): string {
  const today = new Date()
  const diff = dow - today.getDay()
  const d = new Date(today)
  d.setDate(today.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export default function TrainingPage() {
  const [tab, setTab] = useState<Tab>('today')
  const [level, setLevel] = useState<Level>('intermediate')

  const profile = useLiveQuery(() => db.profile.get('me'))
  useEffect(() => {
    if (profile?.level) setLevel(profile.level)
  }, [profile?.level])

  const today = useMemo(() => getTodayPlan(level), [level])
  const todayKcal = useMemo(() => getTodayKcal(today), [today])

  const today_ = new Date().toISOString().slice(0, 10)
  const todayLogs = useLiveQuery(
    () => db.workouts.where('date').equals(today_).toArray(),
    [today_]
  ) ?? []
  const completedIds = new Set(todayLogs.map(l => l.exerciseId))

  const week = useMemo(() => getWeekPlan(level), [level])
  const mondayDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  }, [])
  const sundayDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 6)
    return d.toISOString().slice(0, 10)
  }, [])
  const weekLogs = useLiveQuery(
    () => db.workouts.where('date').between(mondayDate, sundayDate, true, true).toArray(),
    [mondayDate, sundayDate]
  ) ?? []
  const weekCompletion = useMemo(() => {
    const trainingDays = week.filter(d => d.type !== 'rest').length
    const doneDays = new Set(weekLogs.map(l => l.date)).size
    return trainingDays > 0 ? Math.round((doneDays / trainingDays) * 100) : 0
  }, [week, weekLogs])

  async function toggleExercise(ex: Exercise) {
    const date = new Date().toISOString().slice(0, 10)
    const existing = await db.workouts
      .where('date').equals(date)
      .and(l => l.exerciseId === ex.id)
      .first()
    if (existing) {
      await db.workouts.delete(existing.id!)
    } else {
      const workSec = parseDuration(ex.duration) * ex.sets
      const kcal = Math.round((workSec / 60) * ex.caloriesPerMin)
      await db.workouts.add({
        date,
        exerciseId: ex.id,
        exerciseName: ex.name,
        setsCompleted: ex.sets,
        totalSets: ex.sets,
        kcalBurned: kcal,
        completedAt: Date.now(),
      })
    }
  }

  return (
    <div className="page">
      <h2>🏋️ 训练</h2>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg)', borderRadius: 10, padding: 4 }}>
        {(['today', 'week', 'library'] as const).map(k => (
          <button
            key={k}
            className="tab-btn"
            style={{
              flex: 1,
              background: tab === k ? 'white' : 'transparent',
              color: tab === k ? 'var(--pink-deep)' : 'var(--muted)',
              boxShadow: tab === k ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            }}
            onClick={() => setTab(k)}
          >
            {k === 'today' ? '今日' : k === 'week' ? '本周' : '动作库'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--muted)' }}>
        <span>等级:</span>
        <select
          value={level}
          onChange={e => {
            const l = e.target.value as Level
            setLevel(l)
            db.profile.get('me').then(p => {
              if (p) db.profile.update('me', { level: l, updatedAt: Date.now() })
            })
          }}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)' }}
        >
          <option value="beginner">新手 (前 2 周)</option>
          <option value="intermediate">有基础</option>
        </select>
        <span style={{ marginLeft: 'auto' }}>本周完成率: {weekCompletion}%</span>
      </div>

      {tab === 'today' && (
        <>
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--pink) 0%, #FF8FB1 100%)', color: 'white' }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>📅 {getDayName(today.dayOfWeek)}</div>
            <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0' }}>{today.title}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              ⏱ {today.durationMin} 分钟 · 🔥 {intensityLabel(today.intensity)}强度
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>预计消耗: {todayKcal} kcal</div>
          </div>

          {today.type === 'rest' ? (
            <div className="card" style={{ textAlign: 'center', padding: 30 }}>
              <div style={{ fontSize: 40 }}>😴</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>今天是休息日</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{today.coachTip}</div>
            </div>
          ) : (
            <>
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>训练清单</div>
                {today.exercises.map((ex, idx) => {
                  const done = completedIds.has(ex.id)
                  const kcal = Math.round((parseDuration(ex.duration) * ex.sets / 60) * ex.caloriesPerMin)
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleExercise(ex)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 0',
                        borderBottom: idx < today.exercises.length - 1 ? '1px solid var(--line)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: 12,
                        background: done ? 'var(--pink)' : 'transparent',
                        border: done ? 'none' : '2px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 14, flexShrink: 0,
                      }}>{done ? '✓' : ''}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 15,
                          fontWeight: done ? 400 : 500,
                          textDecoration: done ? 'line-through' : 'none',
                          color: done ? 'var(--muted)' : 'var(--text)',
                        }}>{idx + 1}. {ex.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {ex.duration} × {ex.sets} 组 · {bodyPartLabel(ex.bodyPart)}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{kcal} kcal</div>
                    </div>
                  )
                })}
              </div>

              <div className="card" style={{ background: 'var(--bg)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pink-deep)' }}>💡 教练提示</div>
                <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>{today.coachTip}</div>
              </div>

              {todayLogs.length > 0 && (
                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>今日已完成</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--pink-deep)', margin: '4px 0' }}>
                    {todayLogs.reduce((s, l) => s + l.kcalBurned, 0)} <span style={{ fontSize: 16 }}>kcal</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    ≈ {Math.round(todayLogs.reduce((s, l) => s + l.kcalBurned, 0) / 7700 * 1000)}g 脂肪
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'week' && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>本周训练安排</div>
          {week.map(d => {
            const isToday = d.dayOfWeek === new Date().getDay()
            const done = weekLogs.some(l => l.date === dateOfDay(d.dayOfWeek))
            return (
              <div key={d.dayOfWeek} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 8px',
                borderRadius: isToday ? 8 : 0,
                background: isToday ? 'var(--bg)' : 'transparent',
                marginBottom: 2,
              }}>
                <div style={{ width: 50, fontSize: 13, fontWeight: isToday ? 600 : 400 }}>
                  {getDayName(d.dayOfWeek)}{isToday && ' ✦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {d.type === 'rest' ? '😴 休息' : `${d.durationMin}min · ${intensityLabel(d.intensity)}`}
                  </div>
                </div>
                {d.type !== 'rest' && (
                  <div style={{ fontSize: 12, color: done ? 'var(--pink-deep)' : 'var(--muted)' }}>
                    {done ? '✓ 已练' : '○'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'library' && <ExerciseLibrary />}
    </div>
  )
}

function ExerciseLibrary() {
  const [scene, setScene] = useState<Scene>('office')
  const list = useMemo(() => getExercisesByScene(scene), [scene])
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {([
          ['office', '🖥️ 办公室'],
          ['commute', '🚇 通勤'],
          ['home', '🏠 居家'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            className="tab-btn"
            style={{
              flex: 1,
              background: scene === k ? 'var(--pink)' : 'white',
              color: scene === k ? 'white' : 'var(--text)',
              border: scene === k ? 'none' : '1px solid var(--line)',
            }}
            onClick={() => setScene(k)}
          >{label}</button>
        ))}
      </div>

      {list.map(ex => {
        const open = openId === ex.id
        return (
          <div key={ex.id} className="card" style={{ marginBottom: 8 }}>
            <div onClick={() => setOpenId(open ? null : ex.id)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {bodyPartLabel(ex.bodyPart)} · {ex.duration} × {ex.sets} 组 · {'⭐'.repeat(ex.difficulty)}
                </div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--muted)' }}>{open ? '▴' : '▾'}</div>
            </div>
            {open && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--pink-deep)' }}>教学要点</div>
                <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                  {ex.cues.map((c, i) => <li key={i}>{c}</li>)}
                </ol>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                  消耗: {ex.caloriesPerMin} kcal/分钟 · 组间休息: {ex.rest}s
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
