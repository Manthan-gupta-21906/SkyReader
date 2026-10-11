import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcssVite from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcssVite(),
    VitePWA({
      includeAssets: ['favicon.svg', 'offline.html'],
      manifest: {
        name: 'SkyReader',
        short_name: 'SkyReader',
        description: 'Cloud type classifier',
        theme_color: '#3b82c4',
      },
    }),
  ],
})