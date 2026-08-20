import Dexie, { type Table } from 'dexie'

export interface WeightRecord {
  id?: number
  date: string
  weight: number
  note?: string
  createdAt: number
}

export interface MealItem {
  food: string
  grams: number
  kcal: number
}

export interface MealRecord {
  id?: number
  date: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  items: MealItem[]
  totalKcal: number
  source: 'manual' | 'ocr'
  createdAt: number
}

export interface UserProfile {
  id: 'me'
  height: number
  birthYear: number
  gender: 'female' | 'male'
  activity: 'sedentary' | 'light' | 'moderate' | 'active'
  goal: 'lose' | 'maintain' | 'gain'
  targetWeight?: number
  level?: 'beginner' | 'intermediate'
  updatedAt: number
}

export interface WorkoutLog {
  id?: number
  date: string
  exerciseId: string
  exerciseName: string
  setsCompleted: number
  totalSets: number
  kcalBurned: number
  completedAt: number
}

class WeightDB extends Dexie {
  weights!: Table<WeightRecord, number>
  meals!: Table<MealRecord, number>
  profile!: Table<UserProfile, string>
  workouts!: Table<WorkoutLog, number>

  constructor() {
    super('weight-tracker')
    this.version(1).stores({
      weights: '++id, date, createdAt',
      meals: '++id, date, meal, createdAt',
      profile: 'id',
    })
    this.version(2).stores({
      weights: '++id, date, createdAt',
      meals: '++id, date, meal, createdAt',
      profile: 'id',
      workouts: '++id, date, exerciseId, completedAt',
    })
  }
}

export const db = new WeightDB()
