import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../apps/widget-board/App.css';

beforeAll(() => {
  document.documentElement.style.setProperty('--ms-accent', '#0078d4');
  document.documentElement.style.setProperty('--ms-radius-medium', '8px');
  document.body.classList.add('ms-typography');
  document.body.style.fontFamily =
    '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';
  document.body.style.fontWeight = '400';
});

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});
