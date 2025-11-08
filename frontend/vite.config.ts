import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@angrybirdman/common': path.resolve(__dirname, '../common/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
