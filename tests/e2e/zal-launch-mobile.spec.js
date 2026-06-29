const { test, expect } = require('@playwright/test');

test.use({
  browserName: 'chromium',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
});

test('zal.html: mobilny przycisk Dalej otwiera sesję w bieżącym oknie', async ({ page }) => {
  await page.goto('/pages/exams/zal.html');

  await page.locator('#open-test-config').click();
  await expect(page.locator('#zal-open-session-next')).toBeEnabled();

  await page.locator('#zal-open-session-next').click();

  await expect(page).toHaveURL(/\/pages\/exams\/zal_sesje\.html\?length=25&questionType=single-choice$/);
  await expect(page.locator('h1')).toHaveText('Sesja zaliczeniowa');
});
