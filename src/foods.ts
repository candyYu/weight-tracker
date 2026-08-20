// 常见食物每100g 热量 (kcal)
// 来源:中国食物成分表 第6版 简化版
export const FOOD_LIBRARY: Record<string, { kcal: number; category: string }> = {
  // 主食
  '米饭': { kcal: 116, category: '主食' },
  '白米饭': { kcal: 116, category: '主食' },
  '馒头': { kcal: 223, category: '主食' },
  '面条': { kcal: 138, category: '主食' },
  '面包': { kcal: 312, category: '主食' },
  '饺子': { kcal: 250, category: '主食' },
  '包子': { kcal: 227, category: '主食' },
  '粥': { kcal: 46, category: '主食' },
  '燕麦': { kcal: 389, category: '主食' },
  '红薯': { kcal: 86, category: '主食' },
  '土豆': { kcal: 81, category: '主食' },
  '玉米': { kcal: 112, category: '主食' },
  // 蛋白质
  '鸡蛋': { kcal: 144, category: '蛋白' },
  '鸡胸肉': { kcal: 133, category: '蛋白' },
  '牛肉': { kcal: 250, category: '蛋白' },
  '猪肉': { kcal: 242, category: '蛋白' },
  '鱼': { kcal: 139, category: '蛋白' },
  '虾': { kcal: 93, category: '蛋白' },
  '豆腐': { kcal: 81, category: '蛋白' },
  '牛奶': { kcal: 54, category: '蛋白' },
  '酸奶': { kcal: 72, category: '蛋白' },
  // 蔬菜
  '白菜': { kcal: 17, category: '蔬菜' },
  '生菜': { kcal: 15, category: '蔬菜' },
  '西红柿': { kcal: 19, category: '蔬菜' },
  '番茄': { kcal: 19, category: '蔬菜' },
  '黄瓜': { kcal: 16, category: '蔬菜' },
  '菠菜': { kcal: 28, category: '蔬菜' },
  '西兰花': { kcal: 34, category: '蔬菜' },
  '胡萝卜': { kcal: 41, category: '蔬菜' },
  // 水果
  '苹果': { kcal: 52, category: '水果' },
  '香蕉': { kcal: 89, category: '水果' },
  '橙子': { kcal: 47, category: '水果' },
  '葡萄': { kcal: 44, category: '水果' },
  '西瓜': { kcal: 30, category: '水果' },
  '草莓': { kcal: 32, category: '水果' },
  // 零食
  '薯片': { kcal: 536, category: '零食' },
  '巧克力': { kcal: 546, category: '零食' },
  '蛋糕': { kcal: 347, category: '零食' },
  '饼干': { kcal: 433, category: '零食' },
  // 饮品
  '可乐': { kcal: 42, category: '饮品' },
  '奶茶': { kcal: 95, category: '饮品' },
  '咖啡': { kcal: 2, category: '饮品' },
  '啤酒': { kcal: 43, category: '饮品' },
}

export function lookupKcal(food: string): { kcal: number; grams: number } | null {
  const f = FOOD_LIBRARY[food]
  if (!f) return null
  return { kcal: f.kcal, grams: 100 }
}

export function fuzzyMatch(recognized: string): Array<{ food: string; kcal: number; score: number }> {
  const results: Array<{ food: string; kcal: number; score: number }> = []
  const r = recognized.trim()
  if (!r) return results
  for (const [name, info] of Object.entries(FOOD_LIBRARY)) {
    let score = 0
    if (name === r) score = 100
    else if (r.includes(name) || name.includes(r)) score = 80 - Math.abs(name.length - r.length)
    else {
      // 简单字符重叠
      const set1 = new Set(name)
      const set2 = new Set(r)
      let inter = 0
      set2.forEach(c => { if (set1.has(c)) inter++ })
      score = inter * 10
    }
    if (score > 30) results.push({ food: name, kcal: info.kcal, score })
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 5)
}
