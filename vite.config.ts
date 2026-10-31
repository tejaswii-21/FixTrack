import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vite config for FixTrack.
// - @vitejs/plugin-react enables JSX/Fast Refresh.
// - The "@" alias points to ./src so imports look like "@/lib/utils".
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
