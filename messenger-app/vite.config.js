import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    https: false, // Отключить HTTPS
    host: '10.185.101.19',
    port: 5173,
    strictPort: false,
  },
});