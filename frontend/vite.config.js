import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
      '/drive': 'http://localhost:3001',
      '/transfer': 'http://localhost:3001',
    },
  },
});
