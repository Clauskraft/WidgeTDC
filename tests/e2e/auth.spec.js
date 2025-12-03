const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  const validEmail = 'admin@widgettdc.dev';
  const validPassword = 'password';
  const invalidEmail = 'wrong@example.com';
  const invalidPassword = 'wrongpass';

  const selectors = {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    logoutButton: 'button[aria-label="Logout"]',
    errorMessage: '.error-message',
    welcomeText: 'text=Welcome'
  };

  async function login(page, email, password) {
    await page.goto('/login');
    await page.fill(selectors.emailInput, email);
    await page.fill(selectors.passwordInput, password);
    await page.click(selectors.submitButton);
  }

  test('should successfully login with valid credentials', async ({ page }) => {
    await login(page, validEmail, validPassword);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(selectors.welcomeText)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await login(page, invalidEmail, invalidPassword);
    const errorLocator = page.locator(selectors.errorMessage);
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText('Invalid credentials');
  });

  test('should logout successfully', async ({ page }) => {
    await login(page, validEmail, validPassword);
    await page.click(selectors.logoutButton);
    await expect(page).toHaveURL('/login');
  });
});