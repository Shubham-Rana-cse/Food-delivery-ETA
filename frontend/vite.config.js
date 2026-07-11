import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev-only: forwards /api/* to Flask so the browser never sees CORS.
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
