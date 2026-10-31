import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Permet d'importer via @/components/... au lieu de ../../components/...
      '@': path.resolve(__dirname, './src'),
    },
  },
})
