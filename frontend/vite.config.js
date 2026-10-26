import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend dev server on port 5173.
// Proxies /api, /uploads, /docs to the Express backend on port 5001
// so opening docs or APIs from either port 5173 or 5001 works seamlessly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 5173, host: true },
});
