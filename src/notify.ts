// 浏览器通知 (本地,不依赖云)
// 用 setTimeout 做每周一次提醒
import { db } from './db'

const REMIND_KEY = 'weight-last-remind'

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const r = await Notification.requestPermission()
  return r === 'granted'
}

export function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export async function notifyNow(title: string, body: string) {
  if (!canNotify()) return
  // 优先用 Service Worker (在 PWA 安装后更可靠)
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) {
      reg.showNotification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg' })
      return
    }
  }
  new Notification(title, { body })
}

// 检查是否需要提醒
// 策略: 距上次称重 >= 6 天 或 从未称重
export async function checkAndRemind() {
  const last = await db.weights.orderBy('date').last()
  if (!last) {
    notifyNow('该称体重啦', '点开 APP 记录第一次体重,开始追踪。')
    return
  }
  const lastDate = new Date(last.date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / 86400000)
  if (diffDays >= 6) {
    notifyNow('该称体重啦', `距上次已 ${diffDays} 天,定时记录更准。`)
  }
}

// 启动时调用,设一个 24h 轮询
export function startReminderLoop() {
  checkAndRemind()
  setInterval(checkAndRemind, 24 * 60 * 60 * 1000)
}
