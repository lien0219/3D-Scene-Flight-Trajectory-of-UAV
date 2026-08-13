import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:8080'

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
