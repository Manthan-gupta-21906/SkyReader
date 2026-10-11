import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcssVite from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcssVite(), VitePWA({
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'SkyReader',
      short_name: 'SkyReader',
      description: 'Cloud type classifier with weather-based go-out verdict',
      theme_color: '#3b82c4',
      icons: [
        {
          src: 'favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
        },
      ],
    },
  })],
})