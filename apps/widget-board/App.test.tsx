// Simple test for at sikre Microsoft look
// @ts-nocheck

describe('Microsoft Visual Style', () => {
  it('should match Microsoft design tokens', () => {
    // This test assumes the app's CSS is loaded in the test environment (e.g., via JSDOM)
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
