import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { buildPlan, estimateWeeksToGoal } from '../plan'

export default function PlanPage() {
  const profile = useLiveQuery(() => db.profile.get('me'))
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? []
  const last = weights[weights.length - 1]

  if (!profile) {
    return <div className="card"><p className="empty">先去"我的"设置基础信息</p></div>
  }

  const plan = buildPlan(profile)
  const weeks = last ? estimateWeeksToGoal(last.weight, profile.targetWeight ?? last.weight, plan.weeklyChange) : null

  return (
    <>
      <div className="card">
        <h2>基础代谢 & TDEE</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="v" style={{ fontSize: 22 }}>{plan.bmr}</div>
            <div className="l">基础代谢 (kcal)</div>
          </div>
          <div className="stat">
            <div className="v" style={{ fontSize: 22 }}>{plan.tdee}</div>
            <div className="l">TDEE (kcal)</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
          TDEE = 基础代谢 × 活动系数 (久坐 1.2 / 轻 1.375 / 中 1.55 / 高 1.725)
        </p>
      </div>

      <div className="card">
        <h2>每日目标</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="v">{plan.targetKcal}</div>
            <div className="l">总热量 (kcal)</div>
          </div>
          <div className="stat">
            <div className="v" style={{ fontSize: 20, color: plan.weeklyChange < 0 ? 'var(--good)' : plan.weeklyChange > 0 ? 'var(--warn)' : 'var(--muted)' }}>
              {plan.weeklyChange > 0 ? '+' : ''}{plan.weeklyChange}kg
            </div>
            <div className="l">每周变化</div>
          </div>
        </div>
        <p style={{ fontSize: 13, marginTop: 12, color: 'var(--text)' }}>{plan.note}</p>
        {last && weeks !== null && Number.isFinite(weeks) && weeks > 0 && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            按当前速度,约 {weeks} 周后到达目标体重。
          </p>
        )}
      </div>

      <div className="card">
        <h2>宏量营养素</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="v" style={{ fontSize: 22 }}>{plan.proteinG}g</div>
            <div className="l">蛋白质</div>
          </div>
          <div className="stat">
            <div className="v" style={{ fontSize: 22 }}>{plan.carbsG}g</div>
            <div className="l">碳水</div>
          </div>
          <div className="stat">
            <div className="v" style={{ fontSize: 22 }}>{plan.fatG}g</div>
            <div className="l">脂肪</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
          蛋白 2g/kg 目标体重 · 脂肪占总热量 25% · 碳水补足
        </p>
      </div>
    </>
  )
}
