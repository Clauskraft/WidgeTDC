import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolveModule = (pkg: string, entry: string = 'index.js') =>
  path.resolve(__dirname, 'node_modules', pkg, entry);

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.spec.js',
      '**/*.e2e.ts',
      '**/*.e2e.js',
      'tests/e2e/**',
      'tests/persona-tests.spec.ts',
      'tests/e2e-comprehensive.spec.ts',
      'tests/unit/**',
      'tests/integration/**',
      'apps/matrix-frontend/tests/**',
      'apps/matrix-frontend/widgets/__tests__/**',
      'apps/matrix-frontend/src/components/Dashboard/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        'dist/',
        '.github/',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      react: resolveModule('react'),
      'react/jsx-runtime': resolveModule('react', 'jsx-runtime.js'),
      'react/jsx-dev-runtime': resolveModule('react', 'jsx-dev-runtime.js'),
      'react-dom': resolveModule('react-dom'),
      'react-dom/client': resolveModule('react-dom', 'client.js'),
      'react-dom/test-utils': resolveModule('react-dom', 'test-utils.js'),
    },
  },
});
