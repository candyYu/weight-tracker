import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/weight-tracker/', // 部署到 GitHub Pages 子路径
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '体重管理',
        short_name: '体重',
        description: '本地体重与饮食追踪',
        theme_color: '#FF6B9D',
        background_color: '#FFF5F8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/weight-tracker/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  server: { host: '0.0.0.0', port: 5173 },
  base: '/weight-tracker/', // 部署到 GitHub Pages 子路径
})
