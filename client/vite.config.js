import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        // All /api requests are forwarded to the FastAPI backend.
        '/api': {
          target: env.VITE_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        // WebSocket pass-through for the voice pipeline
        '/ws': {
          target: env.VITE_WS_URL?.replace('/ws', '') || 'ws://127.0.0.1:8000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  }
})
