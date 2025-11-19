import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'utils/**/*.test.{js,ts,jsx,tsx}',
      'src/**/*.test.{js,ts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,ts,jsx,tsx}',
      'apps/**/*.test.{js,ts,jsx,tsx}',
      'apps/**/__tests__/**/*.{js,ts,jsx,tsx}',
      'packages/**/*.test.{js,ts,jsx,tsx}',
      'packages/**/__tests__/**/*.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/**',
      '**/*.e2e.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}',
    ],
    setupFiles: './tests/setup.ts',
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
    },
  },
});
