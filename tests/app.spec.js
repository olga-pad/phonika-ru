const { test, expect } = require('@playwright/test');

async function resetApp(page, profile = null) {
  await page.goto('./');
  await page.evaluate((value) => {
    localStorage.clear();
    if (value) localStorage.setItem('soundsteps-profile-v1', JSON.stringify(value));
  }, profile);
  await page.reload();
}

test('приложение открывается и показывает основные режимы', async ({ page }) => {
  await resetApp(page);
  await expect(page.getByRole('button', { name: 'Звуки' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Читаю' })).toBeVisible();
  await expect(page.locator('#parentOpen')).toBeVisible();
});

test('в режиме звуков можно показать и скрыть картинку', async ({ page }) => {
  await resetApp(page);
  await page.getByRole('button', { name: 'Звуки' }).click();
  const picture = page.locator('#letterPicture');
  await expect(picture).toBeHidden();
  await page.locator('#letterShowPicture').click();
  await expect(picture).toBeVisible();
  await page.locator('#letterShowPicture').click();
  await expect(picture).toBeHidden();
});

test('подсказка блокирует отметку «Прочитал сам»', async ({ page }) => {
  await resetApp(page);
  await page.getByRole('button', { name: 'Звуки' }).click();
  await page.locator('#letterHelp').click();
  await expect(page.locator('#letterKnown')).toBeDisabled();
});

test('родитель может отметить все звуки как знакомые', async ({ page }) => {
  await resetApp(page);
  await page.locator('#parentOpen').click();
  const knownPanel = page.locator('.tone-known');
  await knownPanel.locator('.collapse-toggle').click();
  await page.locator('#toggleAllSounds').click();
  await expect(page.locator('#knownSounds .known-letter.selected')).toHaveCount(33);
});

test('после освоения нужных звуков становятся доступны слова', async ({ page }) => {
  const mastered = (chars) => Object.fromEntries(
    chars.map(ch => [ch, { self: 3, mastered: true, masteredAt: 1, dueRound: 0, lastSeenRound: 0 }])
  );
  await resetApp(page, {
    version: 3,
    profile: { id: 'test-child', name: '' },
    level: 1,
    style: 'upper',
    section: 'words',
    sounds: mastered(['к', 'о', 'т', 'м', 'а', 'с']),
    words: {},
    soundQueue: [],
    wordQueue: [],
    soundRound: 1,
    wordSessionSize: 5,
    letterSessionSize: 5
  });
  await expect(page.locator('#word')).not.toHaveText('');
  await expect(page.locator('#readOk')).toBeEnabled();
});

test('выбранный стиль букв сохраняется после перезагрузки', async ({ page }) => {
  await resetApp(page);
  await page.locator('#parentOpen').click();
  await page.locator('#styleSelect').click();
  await page.locator('.style-option[data-style="handLower"]').click();
  await page.reload();
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('soundsteps-profile-v1')));
  expect(profile.style).toBe('handLower');
});
