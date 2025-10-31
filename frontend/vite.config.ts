import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    // Allow overriding via PORT env var (e.g. PORT=5173) and don't fail hard on 5000
    port: Number(process.env.PORT || 5000),
    strictPort: false,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    allowedHosts: ['.replit.dev', '.repl.co']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '~backend/client': path.resolve(__dirname, './client'),
      '~backend': path.resolve(__dirname, '../backend'),
    },
  },
  plugins: [tailwindcss(), react()],
  mode: "development",
  build: {
    minify: false,
  }
})
