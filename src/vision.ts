// 阿里云百炼 qwen-vl-plus 视觉调用
// key 由用户首次进 App 时填,存 localStorage (永不上传)

const KEY_STORAGE = 'qwen_api_key'
const USAGE_STORAGE = 'qwen_usage'  // { 'YYYY-MM-DD': count }

export function getApiKey(): string | null {
  return localStorage.getItem(KEY_STORAGE)
}

export function setApiKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key.trim())
}

export function clearApiKey() {
  localStorage.removeItem(KEY_STORAGE)
}

export const DAILY_LIMIT = 20

export function getTodayUsage(): number {
  const today = new Date().toISOString().slice(0, 10)
  const data = JSON.parse(localStorage.getItem(USAGE_STORAGE) || '{}')
  return data[today] || 0
}

export function incrementUsage() {
  const today = new Date().toISOString().slice(0, 10)
  const data = JSON.parse(localStorage.getItem(USAGE_STORAGE) || '{}')
  data[today] = (data[today] || 0) + 1
  // 清理 30 天前数据
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)
  for (const k of Object.keys(data)) {
    if (k < cutoff) delete data[k]
  }
  localStorage.setItem(USAGE_STORAGE, JSON.stringify(data))
}

export function canCall(): boolean {
  return getTodayUsage() < DAILY_LIMIT
}

export function getRemaining(): number {
  return Math.max(0, DAILY_LIMIT - getTodayUsage())
}

// 把 File 转 base64 dataURL (去掉前缀)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const result = r.result as string
      // result = "data:image/jpeg;base64,xxxxx" -> 只取 xxxxx
      const b64 = result.split(',')[1]
      resolve(b64)
    }
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export interface VisionFoodItem {
  name: string
  grams: number
  kcal: number
}

export async function recognizeFood(file: File): Promise<VisionFoodItem[]> {
  const key = getApiKey()
  if (!key) throw new Error('未设置 API key')
  if (!canCall()) throw new Error(`今日已用 ${getTodayUsage()}/${DAILY_LIMIT},明天再试`)

  const b64 = await fileToBase64(file)

  // 阿里云百炼 OpenAI 兼容接口
  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      messages: [
        {
          role: 'system',
          content: '你是营养师。用户给你拍一张食物照片,你识别图中所有食物,估算每样食物的克数和总热量(kcal)。只返回 JSON 数组,不要其他文字。格式:[{"name":"食物名","grams":克数数字,"kcal":总热量数字}]。如果只能识别一部分,只返回能识别的项。'
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
            { type: 'text', text: '请识别这张图片中的食物,返回 JSON 数组。' }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API 错误 ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  incrementUsage()

  const content = data.choices?.[0]?.message?.content || '{}'
  // qwen 返回的 content 是字符串,可能是 "{\"items\":[...]}" 或 "[...]"
  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('AI 返回的不是 JSON: ' + content.slice(0, 100))
  }

  // 兼容两种返回格式
  const items: any[] = Array.isArray(parsed) ? parsed : (parsed.items || parsed.foods || [])
  return items
    .filter((it: any) => it && it.name && typeof it.kcal === 'number')
    .map((it: any) => ({
      name: String(it.name).trim(),
      grams: Math.max(0, Math.round(Number(it.grams) || 100)),
      kcal: Math.max(0, Math.round(Number(it.kcal) || 0)),
    }))
}
