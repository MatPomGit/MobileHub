const { test, expect } = require('@playwright/test');

/**
 * Test regresyjny paska postępu przewijania.
 * Chroni przed przypadkowym dublowaniem elementu `.scroll-progress`
 * oraz potwierdza, że aktualizacja szerokości działa po przewinięciu.
 */
test('scroll progress exists exactly once and updates width after scroll', async ({ page }) => {
  await page.goto('/index.html');

  // Asercja integralności DOM: po starcie aplikacji istnieje dokładnie jeden pasek.
  await expect(page.locator('.scroll-progress')).toHaveCount(1);

  // Zapewniamy możliwość przewijania, aby zweryfikować logikę aktualizacji szerokości.
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'scroll-progress-test-spacer';
    spacer.style.height = '4000px';
    document.body.appendChild(spacer);
    window.scrollTo(0, 0);
  });

  const initialWidth = await page.locator('#scrollProgress').evaluate((element) => element.style.width || '');

  // Przewijamy stronę i czekamy na obsłużenie eventu scroll przez aplikację.
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(100);

  const scrolledWidth = await page.locator('#scrollProgress').evaluate((element) => element.style.width || '');

  // Po przewinięciu szerokość paska powinna zostać zaktualizowana.
  expect(scrolledWidth).not.toBe(initialWidth);
  expect(scrolledWidth).not.toBe('0%');
});
