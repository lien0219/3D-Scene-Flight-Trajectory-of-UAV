import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Use an explicit IPv4 loopback address so localhost cannot resolve to an
  // unrelated service listening on ::1:8080.
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8080'

  return {
    plugins: [react(), cesium()],
    server: {
      port: 5173,
      proxy: {
        '/ws': {
          target: apiTarget,
          ws: true,
        },
        '/api': {
          target: apiTarget,
        },
        '/healthz': {
          target: apiTarget,
        },
      },
    },
  }
})
