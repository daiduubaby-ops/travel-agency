import { defineConfig } from 'vite'

// Proxy /api requests to backend during development (backend default: http://localhost:5000)
export default defineConfig({
  server: {
    // during development proxy API requests and backend static `/public` files
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      // proxy requests for backend-served static assets (e.g. /public/home-hero.jpg)
      '/public': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
