import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/erpbarber/barberfaster/',
  plugins: [react()],
  server: {
    proxy: {
      // Proxy backend PHP requests to Apache (localhost:80) to avoid CORS during dev
      '/erpbarber/barberfaster/backend': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/erpbarber\/barberfaster\/backend/, '/erpbarber/barberfaster/backend')
      }
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  }
})