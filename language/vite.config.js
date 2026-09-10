import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.BASE_PATH || (command === 'build' ? '/aodl/' : '/'),
  server: {
    host: '127.0.0.1',
    port: 5178,
    strictPort: true,
    fs: { allow: ['..'] },
  },
}));
