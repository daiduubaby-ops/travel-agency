import { defineConfig } from 'vite'

// Proxy /api requests to backend during development (backend default: http://localhost:5000)
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
