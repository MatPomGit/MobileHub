const { test, expect } = require('@playwright/test');

async function switchToTab(page, tabName) {
  const panel = page.locator(`#panel-${tabName}`);
  const selectors = [
    `.page-tab-bar .tab-btn[data-tab="${tabName}"]`,
    `.bottom-nav-btn[data-tab="${tabName}"]`,
    `.pull-shortcut[data-tab="${tabName}"]`
  ];

  for (const selector of selectors) {
    const target = page.locator(selector).first();
    if (await target.isVisible()) {
      await target.click();
      await expect(target).toHaveClass(/\bactive\b/);
      await expect(panel).toHaveClass(/\bactive\b/);
      return;
    }
  }

  await page.evaluate((tab) => window.switchTab?.(tab), tabName);
  await expect(panel).toHaveClass(/\bactive\b/);
}
test.describe('Smoke suite', () => {
  test('opens URL hash and loads matching wiki article', async ({ page }) => {
    await page.goto('/index.html#android-studio');

    await expect(page).toHaveURL(/#android-studio/);
    await expect(page.locator('#wikiArticle')).toContainText('Android Studio');
  });

  test('searches wiki and updates search field value', async ({ page }) => {
    await page.goto('/index.html');

    const searchInput = page.locator('#wikiSearch');
    const wikiCategories = page.locator('.wiki-category');
    const hasCategories = await wikiCategories.first().isVisible({ timeout: 3000 }).catch(() => false);
    const noMatchQuery = 'zzzzzz';

    if (hasCategories) {
      await searchInput.fill(noMatchQuery);
      await expect(page.locator('.wiki-category[style*="display: none"]')).not.toHaveCount(0);
      await expect(searchInput).toHaveValue(noMatchQuery);
    } else {
      await searchInput.fill('Android');
      await expect(searchInput).toHaveValue('Android');
    }
  });

  test('switches tabs and verifies active state', async ({ page }) => {
    await page.goto('/index.html');

    await switchToTab(page, 'materialy');

    await expect(page.locator('#tab-materialy')).toHaveClass(/\bactive\b/);
    await expect(page.locator('#panel-materialy')).toHaveClass(/active/);

    await switchToTab(page, 'egzamin');

    await expect(page.locator('#tab-egzamin')).toHaveClass(/\bactive\b/);
    await expect(page.locator('#panel-egzamin')).toHaveClass(/active/);
  });

  test('renders materials section and supports PDF/live preview entry points', async ({ page }) => {
    await page.goto('/index.html');

    await switchToTab(page, 'materialy');
    await expect(page.locator('#panel-materialy')).toHaveClass(/\bactive\b/);

    const downloadsSection = page.locator('#materials-content .file-item:visible').first();
    const liveSection = page.locator('#materials-live-content .file-item:visible').first();
    const previewFrame = page.locator('#presentation-preview');
    const previewOpenLink = page.locator('#presentation-preview-open');

    await expect(downloadsSection).toBeVisible();
    await expect(liveSection).toBeVisible();

    await expect(previewFrame).toHaveAttribute('src', /\.pdf$/);
    await expect(previewOpenLink).toHaveAttribute('href', /\.pdf$/);

    await expect(liveSection).toHaveAttribute('href', /-live\.html$/);
  });

  test('activates dev mode with 5 taps and reveals student dev tab', async ({ page }) => {
    await page.goto('/index.html');

    const devTrigger = page.locator('#dev-mode-trigger');
    if (!(await devTrigger.isVisible())) {
      const pullHandle = page.locator('#pullHandle');
      if (await pullHandle.isVisible()) {
        await pullHandle.click();
      }

      const pullOptionsBtn = page.locator('#pullOptionsBtn');
      await pullOptionsBtn.waitFor({ state: 'attached' });
      if (await pullOptionsBtn.isVisible()) {
        await pullOptionsBtn.click();
      } else {
        await page.evaluate(() => document.getElementById('pullOptionsBtn')?.click());
      }
    }
    await expect(devTrigger).toBeVisible();

    await expect(page.locator('#tab-studenci')).toHaveClass(/dev-only-tab/);
    await expect(page.locator('#tab-zal')).toHaveClass(/dev-only-tab/);

    for (let i = 0; i < 5; i += 1) {
      await devTrigger.click();
    }

    await expect(page.locator('#tab-studenci')).not.toHaveClass(/dev-only-tab/);
    await expect(page.locator('#tab-zal')).toHaveClass(/dev-only-tab/);
  });
});
