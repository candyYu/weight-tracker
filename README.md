# 体重管理

本地 PWA,体重与饮食追踪。**所有数据存本机浏览器 (IndexedDB)**,不上传任何服务器,不上云。

## 功能

- 一周一次体重提醒 (浏览器本地通知)
- 体重曲线 + 趋势线 + 目标参考线
- 定点体重理论自动算 BMR / TDEE / 每日目标 / 蛋白碳水脂肪分配
- 餐食快速识别 (输入"米饭 200g"自动匹配库算热量)
- 食物库 40+ 常见中国食物
- PWA 可装到手机桌面,离线可用

## 技术栈

Vite + React 18 + TypeScript + Dexie (IndexedDB) + Recharts + vite-plugin-pwa

## 本地开发

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 产物在 dist/
```

## 部署

GitHub Pages (gh-pages 分支)。详细看 `.github/workflows/deploy.yml`。

## 隐私

- 无后端,无 API key,无遥测
- 体重、餐食、个人信息全部存 IndexedDB
- 清浏览器数据 = 全部丢失 (支持导出 JSON 备份)
