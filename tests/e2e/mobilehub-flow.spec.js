// // Test E2E waliduje pełny przepływ użytkownika w panelu mobilnym:
// otwarcie panelu, przejście do zakładki wiki, wyszukiwanie, otwarcie artykułu i nawigację wstecz.
const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

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
