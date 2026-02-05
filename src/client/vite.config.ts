import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: ['champion.mysys.local', 'localhost'],
    proxy: {
      // Proxy API calls to Champion Forge server (Node)
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,
      },
    },
    headers: {
      // Disable caching to ensure OAuth redirects work correctly
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
