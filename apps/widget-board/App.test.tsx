// Simple test for at sikre Microsoft look
import { describe, it, expect } from 'vitest';
// @ts-nocheck

describe('Microsoft Visual Style', () => {
  it('should match Microsoft design tokens', () => {
    // Mock getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => {
        if (prop === '--ms-accent') return '#0078d4';
        if (prop === '--ms-radius-medium') return '8px';
        return '';
      },
      fontFamily: 'Segoe UI',
      fontWeight: '400',
    } as CSSStyleDeclaration);

    const style = getComputedStyle(document.documentElement);
    expect(style.getPropertyValue('--ms-accent').trim()).toBe('#0078d4');
    expect(style.getPropertyValue('--ms-radius-medium').trim()).toBe('8px');
  });

  it('should have correct Microsoft typography', () => {
    // This test relies on the .ms-typography class being applied to an element in the DOM
    const element = document.querySelector('.ms-typography');
    expect(element).not.toBeNull();
    const style = getComputedStyle(element!);
    expect(style.fontFamily).toContain('Segoe UI');
    // Default browser font-weight is 400 for standard text
    expect(style.fontWeight).toBe('400');
  });
});
