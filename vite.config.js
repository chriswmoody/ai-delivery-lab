import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, proxy API calls to Netlify CLI's local functions server
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
})
