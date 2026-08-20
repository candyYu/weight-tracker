import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { ensureNotificationPermission, startReminderLoop, canNotify } from '../notify'

export default function SettingsPage() {
  const profile = useLiveQuery(() => db.profile.get('me'))
  const [showEdit, setShowEdit] = useState(false)

  async function exportData() {
    const weights = await db.weights.toArray()
    const meals = await db.meals.toArray()
    const data = JSON.stringify({ weights, meals, profile }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weight-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function clearAll() {
    if (!confirm('删除所有数据?不可恢复。')) return
    await db.weights.clear()
    await db.meals.clear()
    await db.profile.clear()
  }

  return (
    <>
      <div className="card">
        <h2>基础信息</h2>
        {profile ? (
          <>
            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              身高 {profile.height} cm · {profile.gender === 'female' ? '女' : '男'}<br />
              出生 {profile.birthYear} · 活动 {labelActivity(profile.activity)}<br />
              目标: {labelGoal(profile.goal)} → {profile.targetWeight} kg
            </div>
            <button className="btn secondary" style={{ marginTop: 12 }} onClick={() => setShowEdit(true)}>修改</button>
          </>
        ) : (
          <p className="empty">未设置</p>
        )}
      </div>

      <div className="card">
        <h2>通知</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          状态: {canNotify() ? '✅ 已授权' : '未授权'}<br />
          浏览器通知完全本地,不上传任何数据。
        </p>
        <button className="btn secondary" style={{ marginTop: 12 }} onClick={ensureNotificationPermission}>
          请求通知权限
        </button>
        <button className="btn secondary" style={{ marginTop: 8 }} onClick={startReminderLoop}>
          启用一周一次提醒
        </button>
      </div>

      <div className="card">
        <h2>数据</h2>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
          所有数据存在本机浏览器 (IndexedDB),清除浏览器数据会丢失。
        </p>
        <button className="btn secondary" onClick={exportData}>导出 JSON</button>
        <button className="btn" style={{ marginTop: 8, background: '#999' }} onClick={clearAll}>清空所有数据</button>
      </div>

      {showEdit && profile && <EditProfileModal initial={profile} onClose={() => setShowEdit(false)} />}
    </>
  )
}

function labelActivity(a: string) {
  return { sedentary: '久坐', light: '轻', moderate: '中', active: '高' }[a] || a
}
function labelGoal(g: string) {
  return { lose: '减脂', maintain: '维持', gain: '增肌' }[g] || g
}

function EditProfileModal({ initial, onClose }: { initial: any; onClose: () => void }) {
  const [p, setP] = useState(initial)

  async function save() {
    await db.profile.put({ ...p, updatedAt: Date.now() })
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>修改信息</h3>
        <label>身高</label>
        <input type="number" value={p.height} onChange={e => setP({ ...p, height: +e.target.value })} />
        <label>出生年</label>
        <input type="number" value={p.birthYear} onChange={e => setP({ ...p, birthYear: +e.target.value })} />
        <label>性别</label>
        <select value={p.gender} onChange={e => setP({ ...p, gender: e.target.value })}>
          <option value="female">女</option>
          <option value="male">男</option>
        </select>
        <label>活动量</label>
        <select value={p.activity} onChange={e => setP({ ...p, activity: e.target.value })}>
          <option value="sedentary">久坐</option>
          <option value="light">轻</option>
          <option value="moderate">中</option>
          <option value="active">高</option>
        </select>
        <label>目标</label>
        <select value={p.goal} onChange={e => setP({ ...p, goal: e.target.value })}>
          <option value="lose">减脂</option>
          <option value="maintain">维持</option>
          <option value="gain">增肌</option>
        </select>
        <label>目标体重</label>
        <input type="number" value={p.targetWeight} onChange={e => setP({ ...p, targetWeight: +e.target.value })} />
        <button className="btn" style={{ marginTop: 16 }} onClick={save}>保存</button>
      </div>
    </div>
  )
}
