import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { startReminderLoop } from '../notify'
import { getTodayPlan, getTodayKcal, type Level } from '../trainingPlan'

interface Props {
  onJump?: (t: 'weight' | 'meal' | 'plan' | 'train') => void
}

export default function Dashboard({ onJump }: Props) {
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? []
  const todayMeals = useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10)
    return db.meals.where('date').equals(today).toArray()
  }, []) ?? []
  const profile = useLiveQuery(() => db.profile.get('me'))
  const today_ = new Date().toISOString().slice(0, 10)
  const todayWorkouts = useLiveQuery(
    () => db.workouts.where('date').equals(today_).toArray(),
    [today_]
  ) ?? []

  const [showOnboard, setShowOnboard] = useState(false)

  if (!profile) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>先设置一下基础信息</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
          身高/年龄/活动量 决定你的科学方案。所有数据仅存本机。
        </p>
        <button className="btn" onClick={() => setShowOnboard(true)}>开始设置</button>
        {showOnboard && <OnboardModal onClose={() => setShowOnboard(false)} />}
      </div>
    )
  }

  const last = weights[weights.length - 1]
  const prev = weights[weights.length - 2]
  const delta = last && prev ? last.weight - prev.weight : 0

  const daysSince = last
    ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)
    : null
  const needRemind = daysSince === null || daysSince >= 6

  const todayKcal = todayMeals.reduce((s, m) => s + m.totalKcal, 0)

  // 训练卡片
  const level: Level = (profile.level as Level) || 'intermediate'
  const todayPlan = getTodayPlan(level)
  const planKcal = getTodayKcal(todayPlan)
  const burnedKcal = todayWorkouts.reduce((s, w) => s + w.kcalBurned, 0)
  const trainingDone = todayPlan.exercises.length > 0 && todayWorkouts.length >= todayPlan.exercises.length

  const chartData = weights.slice(-30).map(w => ({
    date: w.date.slice(5),
    weight: w.weight,
  }))

  return (
    <>
      <div className="card">
        <h2>当前体重</h2>
        {last ? (
          <>
            <div className="stat-row">
              <div className="stat">
                <div className="v">{last.weight.toFixed(1)}<span style={{ fontSize: 14, marginLeft: 2 }}>kg</span></div>
                <div className="l">{last.date}</div>
              </div>
              {prev && (
                <div className="stat">
                  <div className={`v ${delta > 0 ? 'delta-up' : 'delta-down'}`} style={{ fontSize: 20 }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                  </div>
                  <div className="l">较上次</div>
                </div>
              )}
              <div className="stat">
                <div className="v" style={{ fontSize: 20 }}>{daysSince}d</div>
                <div className="l">距上次</div>
              </div>
            </div>
            {chartData.length > 1 && (
              <div style={{ height: 140, marginTop: 12 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10 }} width={28} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#FF6B9D" strokeWidth={2} dot={{ r: 3 }} />
                    {profile.targetWeight && (
                      <ReferenceLine y={profile.targetWeight} stroke="#4CAF82" strokeDasharray="3 3" label={{ value: '目标', fontSize: 10, fill: '#4CAF82' }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <p className="empty">还没记录过体重</p>
        )}
        {needRemind && (
          <button className="btn" style={{ marginTop: 12 }} onClick={() => onJump?.('weight')}>
            记录体重
          </button>
        )}
      </div>

      {todayPlan.type !== 'rest' && (
        <div className="card" style={{ background: trainingDone ? '#E8F5E9' : 'linear-gradient(135deg, #FFF0F5 0%, #FFE0EC 100%)' }}>
          <h2>🏋️ 今日训练</h2>
          <div style={{ fontSize: 14, fontWeight: 500, margin: '4px 0' }}>{todayPlan.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            ⏱ {todayPlan.durationMin} 分钟 · 🔥 预计 {planKcal} kcal
          </div>
          <div style={{
            marginTop: 10,
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 13,
          }}>
            {trainingDone
              ? <>✓ 今日训练已完成, 消耗 {burnedKcal} kcal</>
              : <>已完成 {todayWorkouts.length} / {todayPlan.exercises.length} 项</>
            }
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => onJump?.('train')}>
            {trainingDone ? '查看训练' : '开始训练'}
          </button>
        </div>
      )}

      <div className="card">
        <h2>今日饮食</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="v">{todayKcal}</div>
            <div className="l">总热量 (kcal)</div>
          </div>
          <div className="stat">
            <div className="v" style={{ fontSize: 20 }}>{todayMeals.length}</div>
            <div className="l">餐次</div>
          </div>
        </div>
        <button className="btn secondary" style={{ marginTop: 12 }} onClick={() => onJump?.('meal')}>
          记录一餐
        </button>
      </div>

      <div className="card">
        <h2>提醒</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          {needRemind
            ? `距上次称重 ${daysSince ?? '—'} 天,记得定时称重。`
            : `下次提醒: 距今 6 天后。`}
        </p>
        <button className="btn secondary" style={{ marginTop: 12 }} onClick={() => startReminderLoop()}>
          启用本地提醒
        </button>
      </div>
    </>
  )
}

function OnboardModal({ onClose }: { onClose: () => void }) {
  const [height, setHeight] = useState(165)
  const [birthYear, setBirthYear] = useState(1990)
  const [gender, setGender] = useState<'female' | 'male'>('female')
  const [activity, setActivity] = useState<'sedentary' | 'light' | 'moderate' | 'active'>('light')
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain')
  const [targetWeight, setTargetWeight] = useState(55)

  async function save() {
    await db.profile.put({
      id: 'me',
      height, birthYear, gender, activity, goal, targetWeight,
      updatedAt: Date.now(),
    })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>基础信息</h3>
        <label>身高 (cm)</label>
        <input type="number" value={height} onChange={e => setHeight(+e.target.value)} />
        <label>出生年</label>
        <input type="number" value={birthYear} onChange={e => setBirthYear(+e.target.value)} />
        <label>性别</label>
        <select value={gender} onChange={e => setGender(e.target.value as any)}>
          <option value="female">女</option>
          <option value="male">男</option>
        </select>
        <label>活动量</label>
        <select value={activity} onChange={e => setActivity(e.target.value as any)}>
          <option value="sedentary">久坐 (办公室)</option>
          <option value="light">轻活动 (偶尔走)</option>
          <option value="moderate">中等 (每周 3-5 次运动)</option>
          <option value="active">高活动 (每天运动)</option>
        </select>
        <label>目标</label>
        <select value={goal} onChange={e => setGoal(e.target.value as any)}>
          <option value="lose">减脂</option>
          <option value="maintain">维持</option>
          <option value="gain">增肌</option>
        </select>
        <label>目标体重 (kg)</label>
        <input type="number" value={targetWeight} onChange={e => setTargetWeight(+e.target.value)} />
        <button className="btn" style={{ marginTop: 16 }} onClick={save}>保存</button>
      </div>
    </div>
  )
}
