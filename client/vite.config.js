import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api requests are forwarded to the FastAPI backend.
      // Because the request now comes from localhost:5173, the browser stores
      // any Set-Cookie from this proxy response under localhost:5173 — the
      // same origin as the frontend — so credentials are sent on every call.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket pass-through for the voice pipeline
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
