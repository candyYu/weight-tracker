// 动作库 - 场景化教学
export type Scene = 'office' | 'commute' | 'home'
export type BodyPart = 'chest' | 'back' | 'shoulder' | 'arms' | 'legs' | 'glutes' | 'core' | 'cardio' | 'fullbody' | 'mobility'

export interface Exercise {
  id: string
  name: string
  scene: Scene
  bodyPart: BodyPart
  difficulty: 1 | 2 | 3
  duration: string
  sets: number
  rest: number
  cues: string[]
  caloriesPerMin: number
  usedIn: Array<'upper' | 'lower' | 'core' | 'hiit' | 'recovery' | 'cardio' | 'home'>
}

export const EXERCISES: Exercise[] = [
  { id: 'neck-mizi', name: '颈部米字操', scene: 'office', bodyPart: 'mobility', difficulty: 1, duration: '60s', sets: 1, rest: 0, cues: ['头缓慢画"米"字', '左右各 5 次', '动作慢, 不要甩头', '肩放松, 不要耸肩'], caloriesPerMin: 2, usedIn: ['recovery', 'home'] },
  { id: 'chair-twist', name: '椅子转体', scene: 'office', bodyPart: 'core', difficulty: 1, duration: '60s', sets: 2, rest: 15, cues: ['坐姿, 腿不动', '上身向左右最大旋转', '手扶对侧膝盖助力', '保持呼吸, 不要憋气'], caloriesPerMin: 3, usedIn: ['core', 'recovery', 'home'] },
  { id: 'desk-pushup', name: '桌面俯卧撑', scene: 'office', bodyPart: 'chest', difficulty: 2, duration: '45s', sets: 3, rest: 30, cues: ['手撑桌沿, 比肩宽', '身体斜倾成一条直线', '屈肘下压至胸口贴近桌面', '发力推起, 肘部不锁死'], caloriesPerMin: 6, usedIn: ['upper', 'home'] },
  { id: 'standing-calf', name: '站姿提踵', scene: 'office', bodyPart: 'legs', difficulty: 1, duration: '30s', sets: 3, rest: 20, cues: ['扶椅背或桌沿', '脚跟提至最高, 停顿 1 秒', '缓慢下落, 不砸地', '全程收紧核心'], caloriesPerMin: 4, usedIn: ['lower', 'home'] },
  { id: 'chair-squat', name: '椅子深蹲', scene: 'office', bodyPart: 'legs', difficulty: 2, duration: '45s', sets: 3, rest: 30, cues: ['站在椅子前, 双脚与肩同宽', '臀部向后坐, 触及椅面瞬间起身', '膝盖不超脚尖', '夹臀站立'], caloriesPerMin: 6, usedIn: ['lower', 'home'] },
  { id: 'doorway-chest', name: '门框胸拉伸', scene: 'office', bodyPart: 'mobility', difficulty: 1, duration: '30s', sets: 2, rest: 10, cues: ['手肘 90° 扶门框', '身体前倾拉开胸大肌', '感受胸前拉伸, 不痛即可', '左右各做'], caloriesPerMin: 2, usedIn: ['recovery', 'home'] },
  { id: 'rail-pushup', name: '扶手俯卧撑', scene: 'commute', bodyPart: 'chest', difficulty: 2, duration: '30s', sets: 3, rest: 20, cues: ['双手扶地铁/公交扶手', '身体斜 45° 做俯卧撑', '注意脚下防滑', '人多就改握拳压手腕'], caloriesPerMin: 7, usedIn: ['upper', 'home'] },
  { id: 'wall-sit', name: '靠墙静蹲', scene: 'commute', bodyPart: 'legs', difficulty: 2, duration: '45s', sets: 2, rest: 30, cues: ['背靠墙, 双脚前移', '膝盖弯 90°, 大腿与地面平行', '膝盖不超脚尖', '不憋气, 自然呼吸'], caloriesPerMin: 5, usedIn: ['lower', 'home'] },
  { id: 'standing-fold', name: '站姿前屈', scene: 'commute', bodyPart: 'mobility', difficulty: 1, duration: '30s', sets: 1, rest: 0, cues: ['双脚并拢站直', '缓慢前屈摸脚尖', '背部放松不圆肩', '感受腿后拉伸'], caloriesPerMin: 2, usedIn: ['recovery', 'home'] },
  { id: 'standing-twist', name: '站姿转体', scene: 'commute', bodyPart: 'core', difficulty: 1, duration: '30s', sets: 2, rest: 10, cues: ['站姿双脚不动', '上身向左右最大旋转', '手臂自然摆动', '配合呼吸'], caloriesPerMin: 3, usedIn: ['core', 'recovery'] },
  { id: 'pushup', name: '标准俯卧撑', scene: 'home', bodyPart: 'chest', difficulty: 2, duration: '12 次', sets: 4, rest: 45, cues: ['双手比肩略宽', '身体保持一条直线', '屈肘下压至胸口接近地面', '发力推起, 核心收紧'], caloriesPerMin: 8, usedIn: ['upper', 'hiit', 'home'] },
  { id: 'squat', name: '徒手深蹲', scene: 'home', bodyPart: 'legs', difficulty: 2, duration: '15 次', sets: 4, rest: 45, cues: ['双脚与肩同宽, 脚尖略外展', '臀部向后坐, 像坐椅子', '蹲至大腿与地面平行', '起身夹臀'], caloriesPerMin: 8, usedIn: ['lower', 'hiit', 'home'] },
  { id: 'lunge', name: '弓步蹲', scene: 'home', bodyPart: 'legs', difficulty: 2, duration: '12 次', sets: 3, rest: 30, cues: ['前腿 90°, 后膝接近地面', '前膝盖不超脚尖', '上身略前倾但不弓背', '左右腿交替'], caloriesPerMin: 7, usedIn: ['lower', 'home'] },
  { id: 'glute-bridge', name: '臀桥', scene: 'home', bodyPart: 'glutes', difficulty: 1, duration: '15 次', sets: 4, rest: 30, cues: ['仰卧屈膝, 脚贴地', '顶髋至膝-髋-肩成线', '顶峰夹臀 1 秒', '缓慢下落不砸地'], caloriesPerMin: 5, usedIn: ['lower', 'core', 'home'] },
  { id: 'plank', name: '平板支撑', scene: 'home', bodyPart: 'core', difficulty: 2, duration: '30s', sets: 3, rest: 30, cues: ['前臂撑地, 肘在肩正下方', '身体保持一条直线', '不塌腰不翘臀', '全程收紧核心'], caloriesPerMin: 4, usedIn: ['core', 'home'] },
  { id: 'dead-bug', name: '死虫式', scene: 'home', bodyPart: 'core', difficulty: 1, duration: '10 次', sets: 3, rest: 20, cues: ['仰卧, 双臂双腿抬离地面', '对侧手脚同时缓慢伸出', '腰始终贴地', '动作慢, 感受核心发力'], caloriesPerMin: 4, usedIn: ['core', 'home'] },
  { id: 'burpee', name: 'Burpee', scene: 'home', bodyPart: 'fullbody', difficulty: 3, duration: '8 次', sets: 3, rest: 45, cues: ['站立 → 下蹲 → 后跳撑地 → 俯卧撑 → 收回 → 跳起', '全程保持节奏', '累了就跳过俯卧撑', '组间多休息'], caloriesPerMin: 12, usedIn: ['hiit', 'home'] },
  { id: 'high-knee', name: '高抬腿', scene: 'home', bodyPart: 'cardio', difficulty: 2, duration: '30s', sets: 3, rest: 20, cues: ['原地跑, 膝盖尽量抬高', '前脚掌着地, 轻盈', '摆臂配合, 节奏快', '核心收紧, 不后仰'], caloriesPerMin: 10, usedIn: ['hiit', 'cardio', 'home'] },
  { id: 'mountain-climber', name: '登山者', scene: 'home', bodyPart: 'core', difficulty: 2, duration: '30s', sets: 3, rest: 20, cues: ['俯撑姿势', '交替收膝至胸', '臀部不上下晃', '保持呼吸'], caloriesPerMin: 10, usedIn: ['hiit', 'core', 'home'] },
  { id: 'jumping-jack', name: '开合跳', scene: 'home', bodyPart: 'cardio', difficulty: 1, duration: '30s', sets: 3, rest: 20, cues: ['跳跃同时手脚开合', '落地轻盈, 屈膝缓冲', '保持节奏', '累了减速不中断'], caloriesPerMin: 9, usedIn: ['hiit', 'cardio', 'home'] },
  { id: 'crunch', name: '卷腹', scene: 'home', bodyPart: 'core', difficulty: 1, duration: '15 次', sets: 3, rest: 20, cues: ['仰卧屈膝, 腰贴地', '肩胛离地即可, 不坐起', '手放耳侧, 不抱头', '呼气卷起吸气回落'], caloriesPerMin: 5, usedIn: ['core', 'home'] },
  { id: 'russian-twist', name: '俄罗斯转体', scene: 'home', bodyPart: 'core', difficulty: 2, duration: '20 次', sets: 3, rest: 30, cues: ['坐姿, 双脚抬离地面', '上身左右旋转', '手可握重物增加难度', '腰背挺直, 不圆肩'], caloriesPerMin: 6, usedIn: ['core', 'home'] },
  { id: 'fullbody-stretch', name: '全身拉伸', scene: 'home', bodyPart: 'mobility', difficulty: 1, duration: '5min', sets: 1, rest: 0, cues: ['颈/肩/胸/腰/腿, 每个部位 30s', '动作缓慢, 感受拉伸', '不痛, 拉到略紧即可', '配合深呼吸'], caloriesPerMin: 2, usedIn: ['recovery', 'home'] },
  { id: 'skipping-rope', name: '跳绳', scene: 'home', bodyPart: 'cardio', difficulty: 2, duration: '5min', sets: 1, rest: 60, cues: ['前脚掌着地, 轻盈', '手腕摇绳, 不甩肩', '膝盖微屈缓冲', '累了改无绳模拟'], caloriesPerMin: 11, usedIn: ['cardio', 'hiit', 'home'] },
  { id: 'walk', name: '快走', scene: 'home', bodyPart: 'cardio', difficulty: 1, duration: '15min', sets: 1, rest: 0, cues: ['配速 6-7 km/h', '摆臂配合, 步幅适中', '心率 110-130', '可分 2 段完成'], caloriesPerMin: 5, usedIn: ['cardio', 'home'] },
]

export function getExercisesByScene(scene: Scene): Exercise[] {
  return EXERCISES.filter(e => e.scene === scene)
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id)
}
