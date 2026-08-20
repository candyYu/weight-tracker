// 每日训练计划引擎
import { getExerciseById, type Exercise } from './exercises'

export type DayType = 'upper' | 'lower' | 'core' | 'hiit' | 'recovery' | 'cardio' | 'rest' | 'home'
export type Level = 'beginner' | 'intermediate'

export interface DayPlan {
  dayOfWeek: number
  type: DayType
  title: string
  intensity: 'low' | 'medium' | 'high'
  durationMin: number
  exercises: Exercise[]
  coachTip: string
}

const WEEKLY_TEMPLATE: Record<number, Omit<DayPlan, 'dayOfWeek' | 'exercises' | 'durationMin'>> = {
  1: { type: 'upper', title: '上肢力量 + 有氧', intensity: 'medium', coachTip: '周一开练, 推/拉/走三件套。激活全身, 启动一周代谢。' },
  2: { type: 'lower', title: '下肢力量 + 核心', intensity: 'medium', coachTip: '下肢是燃脂主力, 大肌群消耗大。核心稳定是所有动作的基础。' },
  3: { type: 'hiit', title: 'HIIT 全身燃脂', intensity: 'high', coachTip: '高强度间歇, 15 分钟 ≈ 慢跑 45 分钟。短时高效, 适合不想动日。' },
  4: { type: 'recovery', title: '主动恢复 (拉伸)', intensity: 'low', coachTip: '主动恢复 = 低强度有氧 + 拉伸。让肌肉修复, 不酸不累。' },
  5: { type: 'cardio', title: '有氧 + 上肢耐力', intensity: 'medium', coachTip: '跳绳/快走 + 多组俯卧撑。提升心肺 + 上肢耐力。' },
  6: { type: 'home', title: '自由训练日', intensity: 'medium', coachTip: '户外跑/球类/游泳, 你选。我不强求, 玩开心就好。' },
  0: { type: 'rest', title: '完全休息', intensity: 'low', coachTip: '睡到自然醒。脂肪在睡眠中燃烧, 休息日是变瘦日。' },
}

function buildExercisesForDay(type: DayType, level: Level): Exercise[] {
  if (type === 'rest') return []
  const scale = level === 'beginner' ? 0.5 : 1
  const adapt = (id: string): Exercise | null => {
    const e = getExerciseById(id)
    if (!e) return null
    if (scale === 1) return e
    return { ...e, sets: Math.max(1, Math.round(e.sets * scale)) }
  }
  switch (type) {
    case 'upper': return ['pushup', 'desk-pushup', 'plank', 'walk'].map(adapt).filter(Boolean) as Exercise[]
    case 'lower': return ['squat', 'lunge', 'glute-bridge', 'plank'].map(adapt).filter(Boolean) as Exercise[]
    case 'core': return ['plank', 'dead-bug', 'crunch', 'russian-twist'].map(adapt).filter(Boolean) as Exercise[]
    case 'hiit': return ['burpee', 'high-knee', 'mountain-climber', 'jumping-jack', 'plank'].map(adapt).filter(Boolean) as Exercise[]
    case 'recovery': return ['fullbody-stretch', 'neck-mizi'].map(adapt).filter(Boolean) as Exercise[]
    case 'cardio': return ['skipping-rope', 'pushup', 'plank'].map(adapt).filter(Boolean) as Exercise[]
    case 'home': return ['pushup', 'squat', 'plank'].map(adapt).filter(Boolean) as Exercise[]
    default: return []
  }
}

function parseDuration(d: string): number {
  if (d.endsWith('s')) return parseInt(d)
  if (d.endsWith('min')) return parseInt(d) * 60
  if (d.includes('次')) return parseInt(d) * 2.5
  return 30
}

function estimateDuration(exercises: Exercise[]): number {
  let totalSec = 0
  for (const e of exercises) {
    const sec = parseDuration(e.duration)
    totalSec += sec * e.sets + e.rest * (e.sets - 1)
  }
  return Math.max(1, Math.round(totalSec / 60))
}

export function getTodayPlan(level: Level = 'intermediate', date: Date = new Date()): DayPlan {
  const dow = date.getDay()
  const template = WEEKLY_TEMPLATE[dow]
  const exercises = buildExercisesForDay(template.type, level)
  return { dayOfWeek: dow, ...template, exercises, durationMin: estimateDuration(exercises) }
}

export function getWeekPlan(level: Level = 'intermediate'): DayPlan[] {
  const week: DayPlan[] = []
  const base = new Date()
  const monday = new Date(base)
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7))
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    week.push(getTodayPlan(level, d))
  }
  return week
}

export function getTodayKcal(plan: DayPlan): number {
  let kcal = 0
  for (const e of plan.exercises) {
    const workSec = parseDuration(e.duration) * e.sets
    kcal += (workSec / 60) * e.caloriesPerMin
  }
  return Math.round(kcal)
}
