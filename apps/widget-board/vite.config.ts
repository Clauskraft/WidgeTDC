import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    root: __dirname,
    build: {
      outDir: path.resolve(__dirname, '../../dist'),
      emptyOutDir: true,
    },
    server: {
      port: 8888,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'ws://localhost:3001',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      // Keys are now handled in backend
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'apps/widget-board'),
      },
    },
  };
});
