import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: parseInt(process.env.VITE_PORT || '3000'),
    watch: {
      usePolling: true,  // Required for Docker on Windows/Mac
      interval: 1000,    // Check for changes every second
    },
    hmr: {
      host: 'localhost',
      port: parseInt(process.env.VITE_PORT || '3000'),
      protocol: 'ws',
    },
  },
})