// Test PWA/offline weryfikuje, czy start_url działa bez sieci po pierwszym uruchomieniu online.
// Blokuje regresję, w której aplikacja otwiera pustą stronę lub błędny fallback zamiast właściwej treści.
const { test, expect } = require('@playwright/test');

test('start_url remains reachable offline after first online load', async ({ page, context }) => {
  await page.goto('/index.html');

  await expect(page.locator('#pwaUpdateBanner')).toBeHidden();

  await expect(async () => {
    const swCount = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 0;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length;
    });
    expect(swCount).toBeGreaterThan(0);
  }).toPass({ timeout: 15000 });

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;

    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
    });
  });

  await context.setOffline(true);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

  const offlineIndicator = page.locator('#offlineIndicator');
  await expect(offlineIndicator).toContainText('Tryb offline');
  await expect(page.locator('#mainContent')).toBeVisible();

  await context.setOffline(false);
  await expect.poll(async () => page.evaluate(() => navigator.onLine)).toBeTruthy();
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(offlineIndicator).toContainText('Online');
  await expect(page.locator('#mainContent')).toBeVisible();
});
