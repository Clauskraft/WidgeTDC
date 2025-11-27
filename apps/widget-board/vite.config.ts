import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isElectron = env.VITE_ELECTRON === 'true';

  return {
    root: __dirname,
    base: isElectron ? './' : '/',
    build: {
      outDir: path.resolve(__dirname, '../../dist'),
      emptyOutDir: true,
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['framer-motion', '@headlessui/react', 'lucide-react'],
            grid: ['react-grid-layout'],
          },
        },
      },
    },
    server: {
      port: 8888,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:3001',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@widgets': path.resolve(__dirname, './src/widgets'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
    },
    // Let postcss.config.js handle PostCSS plugins (including Tailwind)
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-grid-layout', 'framer-motion'],
    },
  };
});
