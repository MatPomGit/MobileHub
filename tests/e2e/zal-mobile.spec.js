const { test, expect } = require('@playwright/test');

// Celowo używamy Chromium, aby nie wymagać WebKit (który jest wymagany przez gotowy profil iPhone).
test.use({
  browserName: 'chromium',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
});

test('zal_sesje.html: mobilny render formularza i statusów', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/zal_sesje.html?length=25&questionType=single-choice');

  await expect(page.locator('h1')).toHaveText('Sesja zaliczeniowa');
  await expect(page.locator('#session-name-display')).toBeVisible();
  await expect(page.locator('#quiz-meta')).toContainText('Najpierw zaakceptuj uprawnienia do kamery');
  await expect(page.locator('#session-module-statuses')).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth;
  });
  expect(hasHorizontalOverflow).toBeFalsy();

  const statusMessage = await page.locator('#face-status').innerText();
  expect(statusMessage).toContain('Twarz:');

  expect(errors).toEqual([]);
});
