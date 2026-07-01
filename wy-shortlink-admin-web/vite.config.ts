import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/s': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass: (req) => {
          // 只有 /s/{shortCode} 格式才代理，排除 /src/ Vite 源文件
          if (/^\/s\/[^/]+$/.test(req.url || '')) return null;
          return req.url;
        },
      },
    },
  },
})
