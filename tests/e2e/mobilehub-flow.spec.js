// Test E2E wykrywa regresję krytycznej ścieżki użytkownika: panel -> zakładka -> wyszukiwanie -> artykuł -> powrót.
// Blokuje sytuację, w której nawigacja mobilna przestaje prowadzić do treści i nie da się wrócić do listy.
const { test, expect } = require('@playwright/test');

test('mobile pull panel flow: open, tab, search, open article, back', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('#pullHandle').click();
  await expect(page.locator('#pullPanel')).toHaveClass(/open/);

  await page.locator('.pull-shortcut[data-tab="wiki"]').click();

  await page.locator('#pullSearchInput').fill('Android Studio');
  const result = page.locator('.pull-result-item').first();
  await expect(result).toBeVisible();
  await result.click();

  await expect(page).toHaveURL(/#android-studio/);
  await expect(page.locator('#wikiArticle')).toContainText('Android Studio');

  await page.goBack();
  await expect(page).not.toHaveURL(/#android-studio/);
});
