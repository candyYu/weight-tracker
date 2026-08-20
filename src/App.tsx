import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import Dashboard from './components/Dashboard'
import WeightPage from './components/WeightPage'
import MealPage from './components/MealPage'
import PlanPage from './components/PlanPage'
import SettingsPage from './components/SettingsPage'
import { ensureNotificationPermission } from './notify'

type Tab = 'home' | 'weight' | 'meal' | 'plan' | 'me'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const profile = useLiveQuery(() => db.profile.get('me'))

  // 首次打开请求通知权限
  if (profile && 'Notification' in window && Notification.permission === 'default') {
    ensureNotificationPermission()
  }

  return (
    <>
      <div className="app-header">
        <h1>体重管理</h1>
        <span className="badge">本地 · 隐私优先</span>
      </div>

      {tab === 'home' && <Dashboard onJump={setTab as any} />}
      {tab === 'weight' && <WeightPage />}
      {tab === 'meal' && <MealPage />}
      {tab === 'plan' && <PlanPage />}
      {tab === 'me' && <SettingsPage />}

      <nav className="tabs">
        <button className={`tab ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <span className="ico">🏠</span>首页
        </button>
        <button className={`tab ${tab === 'weight' ? 'active' : ''}`} onClick={() => setTab('weight')}>
          <span className="ico">⚖️</span>体重
        </button>
        <button className={`tab ${tab === 'meal' ? 'active' : ''}`} onClick={() => setTab('meal')}>
          <span className="ico">🍱</span>饮食
        </button>
        <button className={`tab ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>
          <span className="ico">📊</span>方案
        </button>
        <button className={`tab ${tab === 'me' ? 'active' : ''}`} onClick={() => setTab('me')}>
          <span className="ico">👤</span>我的
        </button>
      </nav>
    </>
  )
}
