import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    watch: {
      // Improve reliability of file watching on Windows/WSL and network drives
      usePolling: true,
      interval: 300,
    },
  },
})
