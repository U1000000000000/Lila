import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Local backend address — only used by the dev-server proxy.
  // Set VITE_BACKEND_URL_LOCAL in client/.env to override.
  const backendHttp = env.VITE_BACKEND_URL_LOCAL || 'http://localhost:8000';
  // Derive the WebSocket address from the HTTP address (http→ws, https→wss).
  const backendWs = backendHttp.replace(/^https?/, (m) => m === 'https' ? 'wss' : 'ws');

  return {
    plugins: [react()],
    server: {
      proxy: {
        // All /api requests are forwarded to the FastAPI backend.
        '/api': {
          target: backendHttp,
          changeOrigin: true,
          secure: false,
          // Rewrite cookie domain so the browser stores cookies for localhost:5173
          // (the Vite dev origin) rather than localhost:8000 (the backend origin).
          // Without this, Set-Cookie headers from the backend are silently dropped
          // by the browser because they reference the wrong host.
          cookieDomainRewrite: { '*': '' },
        },
        // WebSocket pass-through for the voice pipeline
        '/ws': {
          target: backendWs,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  }
})
