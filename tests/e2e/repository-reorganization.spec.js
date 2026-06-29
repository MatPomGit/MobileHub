const { test, expect } = require('@playwright/test');

const PUBLIC_PAGES = [
  {
    path: '/pages/exams/test.html',
    marker: 'Test wiedzy ABCD',
  },
  {
    path: '/pages/exams/zal.html',
    marker: 'wejściówki i zaliczenia online',
  },
  {
    path: '/pages/exams/zal_sesje.html?length=25&questionType=single-choice',
    marker: 'Sesja zaliczeniowa',
  },
  {
    path: '/pages/community/studenci.html',
    marker: 'zgłoszenia projektów',
  },
  {
    path: '/pages/guides/pierwsza-aplikacja.html',
    marker: 'Moja pierwsza aplikacja mobilna',
  },
  {
    path: '/pages/guides/projektowanie-aplikacji.html',
    marker: 'Projektowanie aplikacji',
  },
  {
    path: '/pages/guides/obrona_projektu.html',
    marker: 'Obrona projektu i moduł oceniania',
  },
];

for (const publicPage of PUBLIC_PAGES) {
  test(publicPage.path + ' odpowiada po reorganizacji', async ({ page }) => {
    const response = await page.goto(publicPage.path, {
      waitUntil: 'domcontentloaded',
    });

    expect(response).not.toBeNull();
    expect(response.ok()).toBeTruthy();
    await expect(page.locator('body')).toContainText(publicPage.marker);
  });
}

test('strona główna wskazuje nowe lokalizacje stron', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.locator('a[href="pages/exams/test.html"]').first()).toHaveAttribute(
    'href',
    'pages/exams/test.html',
  );
  await expect(page.locator('a[href="pages/guides/pierwsza-aplikacja.html"]').first()).toHaveAttribute(
    'href',
    'pages/guides/pierwsza-aplikacja.html',
  );
  await expect(page.locator('#iframe-studenci')).toHaveAttribute(
    'src',
    'pages/community/studenci.html',
  );
  await expect(page.locator('#iframe-zal')).toHaveAttribute(
    'data-src',
    'pages/exams/zal.html',
  );
});
