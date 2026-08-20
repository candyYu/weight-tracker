import Dexie, { type Table } from 'dexie'

export interface WeightRecord {
  id?: number
  date: string // YYYY-MM-DD
  weight: number // kg
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
  date: string // YYYY-MM-DD
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  items: MealItem[]
  totalKcal: number
  source: 'manual' | 'ocr'
  createdAt: number
}

export interface UserProfile {
  id: 'me'
  height: number // cm
  birthYear: number
  gender: 'female' | 'male'
  activity: 'sedentary' | 'light' | 'moderate' | 'active'
  goal: 'lose' | 'maintain' | 'gain'
  targetWeight?: number
  updatedAt: number
}

class WeightDB extends Dexie {
  weights!: Table<WeightRecord, number>
  meals!: Table<MealRecord, number>
  profile!: Table<UserProfile, string>

  constructor() {
    super('weight-tracker')
    this.version(1).stores({
      weights: '++id, date, createdAt',
      meals: '++id, date, meal, createdAt',
      profile: 'id',
    })
  }
}

export const db = new WeightDB()
