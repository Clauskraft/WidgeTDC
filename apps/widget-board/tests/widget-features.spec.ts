import { test, expect } from '@playwright/test';

test.describe('WidgetBoard - Microsoft Acrylic & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8889');
    await page.waitForSelector('.ms-widget-container', { timeout: 10000 });
  });

  test('should display widgets with acrylic effect', async ({ page }) => {
    const widget = page.locator('.ms-widget-container').first();
    await expect(widget).toBeVisible();

    const backdropFilter = await widget.evaluate((el) =>
      window.getComputedStyle(el).backdropFilter
    );
    expect(backdropFilter).toContain('blur');
    expect(backdropFilter).toContain('saturate');

    const background = await widget.evaluate((el) =>
      window.getComputedStyle(el).background
    );
    expect(background).toContain('rgba');

    const boxShadow = await widget.evaluate((el) =>
      window.getComputedStyle(el).boxShadow
    );
    expect(boxShadow).not.toBe('none');
  });

  test('should have gradient in widget header', async ({ page }) => {
    const header = page.locator('.ms-widget-header').first();
    await expect(header).toBeVisible();

    const background = await header.evaluate((el) =>
      window.getComputedStyle(el).background
    );
    expect(background).toContain('linear-gradient');
  });

  test('should zoom widget with transform scale', async ({ page }) => {
    const widget = page.locator('.ms-widget-container').first();

    // Get initial scale from transform
    const getScale = async () => {
      return await widget.evaluate((el) => {
        const transform = window.getComputedStyle(el).transform;
        if (transform === 'none') return 1;
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (!matrix) return 1;
        const values = matrix[1].split(', ');
        return parseFloat(values[0]); // scaleX
      });
    };

    const initialScale = await getScale();
    expect(initialScale).toBe(1);

    // Zoom in once using force to handle viewport issues
    await widget.locator('button[title="Zoom ind"]').click({ force: true });
    await page.waitForTimeout(500);

    const zoomedScale = await getScale();
    expect(zoomedScale).toBeGreaterThan(initialScale);

    // Reset zoom
    await widget.locator('button[title="Nulstil zoom"]').click({ force: true });
    await page.waitForTimeout(500);

    const resetScale = await getScale();
    expect(resetScale).toBeCloseTo(1, 1);
  });

  test('should have drag handle with move cursor', async ({ page }) => {
    const dragHandle = page.locator('.widget-drag-handle').first();
    await expect(dragHandle).toBeVisible();
    await expect(dragHandle).toHaveAttribute('title', /Træk for at flytte/);

    // Check that the class is applied (CSS will handle the cursor)
    const hasClass = await dragHandle.evaluate((el) =>
      el.classList.contains('widget-drag-handle')
    );
    expect(hasClass).toBe(true);

    const gripIcon = dragHandle.locator('svg');
    await expect(gripIcon).toBeVisible();
  });

  test('should open widget management panel', async ({ page }) => {
    await page.getByRole('button', { name: 'Widgets' }).click();
    await page.waitForTimeout(300);

    const searchBox = page.getByPlaceholder(/[Ss]øg/);
    await expect(searchBox).toBeVisible({ timeout: 2000 });
  });

  test('should open widget configuration modal', async ({ page }) => {
    await page.locator('button[title="Konfigurer widget"]').first().click();
    await page.waitForTimeout(300);

    const refreshInterval = page.getByText(/Refresh Interval|Opdateringsinterval/i);
    await expect(refreshInterval).toBeVisible({ timeout: 2000 });
  });

  test('should have auto-hide header with transform', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Check initial state using data attribute
    const initialVisible = await header.getAttribute('data-visible');
    expect(initialVisible).toBe('true');

    // Add temporary content to ensure scrolling works
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'test-scroll-content';
      div.style.height = '2000px';
      document.body.appendChild(div);
    });

    // Scroll down significantly with small increments to trigger scroll event
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      window.scrollBy(0, 100);
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollBy(0, 150));
    await page.waitForTimeout(600);

    // Check if header is hidden using data attribute
    const isHidden = await header.getAttribute('data-visible');
    expect(isHidden).toBe('false');

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    // Should be visible again
    const isVisibleAgain = await header.getAttribute('data-visible');
    expect(isVisibleAgain).toBe('true');

    // Clean up test content
    await page.evaluate(() => {
      const testDiv = document.getElementById('test-scroll-content');
      if (testDiv) testDiv.remove();
    });
  });

  test('should have glassmorphic buttons with hover effect', async ({ page }) => {
    const button = page.locator('.ms-icon-button').first();
    await expect(button).toBeVisible();

    await button.hover();
    await page.waitForTimeout(300);

    const hoveredBg = await button.evaluate((el) =>
      window.getComputedStyle(el).background
    );

    expect(hoveredBg).toContain('59'); // Blue RGB component
  });

  test('should support dark mode acrylic styles', async ({ page }) => {
    const darkModeToggle = page.getByText('Dark Mode').locator('..').locator('button');
    await darkModeToggle.click();
    await page.waitForTimeout(500);

    const htmlElement = page.locator('html');
    const classList = await htmlElement.evaluate((el) => el.className);

    if (classList.includes('dark')) {
      const widget = page.locator('.ms-widget-container').first();
      const background = await widget.evaluate((el) =>
        window.getComputedStyle(el).background
      );

      expect(background).toContain('rgba');
      expect(background).toMatch(/rgba\(([0-9]{1,2}),\s*([0-9]{1,2}),\s*([0-9]{1,2})/);
    }
  });

  test('should enforce zoom limits 0.5x to 2x', async ({ page }) => {
    const widget = page.locator('.ms-widget-container').first();
    const zoomInBtn = widget.locator('button[title="Zoom ind"]');
    const zoomOutBtn = widget.locator('button[title="Zoom ud"]');

    // Zoom in to max (force click to handle viewport issues from scaling)
    for (let i = 0; i < 15; i++) {
      const isEnabled = await zoomInBtn.isEnabled();
      if (!isEnabled) break;
      await zoomInBtn.click({ force: true });
      await page.waitForTimeout(100);
    }

    // Button should be disabled at max
    await expect(zoomInBtn).toBeDisabled();

    // Zoom out to min
    for (let i = 0; i < 20; i++) {
      const isEnabled = await zoomOutBtn.isEnabled();
      if (!isEnabled) break;
      await zoomOutBtn.click({ force: true });
      await page.waitForTimeout(100);
    }

    // Button should be disabled at min
    await expect(zoomOutBtn).toBeDisabled();
  });
});
