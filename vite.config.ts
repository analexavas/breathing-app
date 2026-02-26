import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Capacitor needs assets served from root, not a sub-path
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
