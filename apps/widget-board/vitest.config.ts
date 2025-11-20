import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [], // Add setup file if needed later
        exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'], // Exclude e2e tests in tests/ folder
    },
});
