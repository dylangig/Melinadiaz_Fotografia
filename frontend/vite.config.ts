import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Worker local (npx wrangler dev dentro de /worker)
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  }
})
