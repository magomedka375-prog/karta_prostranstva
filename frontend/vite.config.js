import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Карта Пространства',
        short_name: 'Карта',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ],
  server: { proxy: { '/api': 'http://localhost:3001', '/uploads': 'http://localhost:3001' } }
});