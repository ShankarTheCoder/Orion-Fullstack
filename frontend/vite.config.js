import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend dev server on port 5173 (PDF Section 5/6). It talks to the
// Express API at VITE_API_URL (default http://localhost:5000/api/v1).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  preview: { port: 5173, host: true },
});
