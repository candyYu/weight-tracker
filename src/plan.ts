// 定点体重理论 (Fixed Weight Point Theory) 简化算法
// 参考:Lyle McDonald / Mifflin-St Jeor BMR + 活动系数 + 目标调整
import type { UserProfile } from './db'

export function calcBMR(p: UserProfile): number {
  // Mifflin-St Jeor
  const age = new Date().getFullYear() - p.birthYear
  const base = 10 * (p.targetWeight ?? 60) + 6.25 * p.height - 5 * age
  return p.gender === 'male' ? base + 5 : base - 161
}

const ACTIVITY_FACTOR = {
  sedentary: 1.2,    // 久坐
  light: 1.375,      // 轻活动
  moderate: 1.55,    // 中等活动
  active: 1.725,     // 高活动
}

export function calcTDEE(p: UserProfile): number {
  return Math.round(calcBMR(p) * ACTIVITY_FACTOR[p.activity])
}

export interface Plan {
  bmr: number
  tdee: number
  targetKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  weeklyChange: number // kg
  note: string
}

export function buildPlan(p: UserProfile): Plan {
  const tdee = calcTDEE(p)
  let targetKcal = tdee
  let weeklyChange = 0
  let note = '维持当前体重,蛋白质充足即可。'

  if (p.goal === 'lose') {
    targetKcal = tdee - 500 // 0.5kg/week
    weeklyChange = -0.5
    note = '减脂期:每日热量低于 TDEE 500 kcal,目标每周减重 0.5 kg。'
  } else if (p.goal === 'gain') {
    targetKcal = tdee + 300
    weeklyChange = 0.3
    note = '增肌期:每日热量高于 TDEE 300 kcal,目标每周增重 0.3 kg (优先增肌非脂肪)。'
  }

  // 宏量分配: 蛋白 2g/kg 目标体重, 脂肪 25% 热量, 碳水补足
  const weightKg = p.targetWeight ?? 60
  const proteinG = Math.round(weightKg * 2)
  const fatG = Math.round((targetKcal * 0.25) / 9)
  const carbsG = Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4)

  return {
    bmr: Math.round(calcBMR(p)),
    tdee,
    targetKcal,
    proteinG,
    carbsG,
    fatG,
    weeklyChange,
    note,
  }
}

// 估算距目标日期
export function estimateWeeksToGoal(currentWeight: number, targetWeight: number, weeklyChange: number): number {
  if (weeklyChange === 0) return Infinity
  const diff = targetWeight - currentWeight
  if (Math.sign(diff) !== Math.sign(weeklyChange)) return Infinity // 方向不对
  return Math.ceil(Math.abs(diff / weeklyChange))
}
