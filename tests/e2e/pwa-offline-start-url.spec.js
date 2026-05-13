// Test PWA/offline wykrywa brak cache dla start_url po pierwszym załadowaniu.
// Blokuje regresję, w której zainstalowana aplikacja nie startuje offline po wcześniejszej wizycie.
const { test, expect } = require('@playwright/test');

test('start_url remains reachable offline after first online load', async ({ page, context }) => {
  await page.goto('/index.html');

  await expect(async () => {
    const swCount = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 0;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length;
    });
    expect(swCount).toBeGreaterThan(0);
  }).toPass({ timeout: 15000 });

  await context.setOffline(true);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();

  const offlineFallback = page.locator('#offlineIndicator');
  await expect(offlineFallback).toContainText('Tryb offline');

  await context.setOffline(false);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(offlineFallback).toContainText('Online');
  await expect(page.locator('#mainContent')).toBeVisible();
});
