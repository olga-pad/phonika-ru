const { test, expect } = require('@playwright/test');

async function startLetters(page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#lettersTab').click();
}

test('PNG hints fit the existing area and preserve hint/continue behavior', async ({ page }) => {
  await startLetters(page);
  const picture = page.locator('#letterPicture');
  const card = page.locator('#letterCard');
  const before = await card.boundingBox();
  const progress = await page.evaluate(() => JSON.stringify(letterProgress));
  await page.locator('#letterShowPicture').click();
  const image = picture.locator('img');
  await expect(image).toHaveAttribute('alt', 'автобус');
  await expect.poll(() => image.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
  const [area, bounds] = await Promise.all([picture.boundingBox(), image.boundingBox()]);
  expect(bounds.width).toBeLessThanOrEqual(area.width);
  expect(bounds.height).toBeLessThanOrEqual(area.height);
  expect(await card.boundingBox()).toEqual(before);
  await page.locator('#letterShowPicture').click();
  await expect(picture).toBeHidden();
  await expect(page.locator('#letterKnown')).toContainText('Продолжить');
  await page.locator('#letterKnown').click();
  await expect(card).not.toHaveText('А');
  expect(await page.evaluate(() => JSON.stringify(letterProgress))).toBe(progress);
  await expect(page.locator('.correct-confetti')).toHaveCount(0);
});

test('all alphabet hints use matching pictures or keep the original emoji', async ({ page }) => {
  await startLetters(page);
  const entries = await page.evaluate(() => letters);
  const expected = new Set(['автобус', 'мама', 'кот', 'игрушки', 'нос', 'папа', 'барабан', 'волк', 'дом', 'гусеница', 'зебра', 'жук', 'шар', 'цыплёнок', 'сыр', 'енот', 'ёжик', 'юла', 'конь', 'подъезд']);
  for (const [ch, word, emoji] of entries) {
    await page.evaluate(ch => { letterSession = [ch]; letterIndex = 0; showLetter(); }, ch);
    await page.locator('#letterShowPicture').click();
    if (expected.has(word)) {
      const image = page.locator('#letterPicture img');
      await expect(image).toHaveAttribute('alt', word);
      await expect.poll(() => image.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    } else {
      await expect(page.locator('#letterPicture img')).toHaveCount(0);
      await expect(page.locator('#letterPicture')).toHaveText(emoji);
    }
  }
});

test('word pictures match meaning and fall back when PNG cannot load', async ({ page }) => {
  await page.route('**/assets/pictures/cat.png', route => route.abort());
  await startLetters(page);
  await page.evaluate(() => { letterSession = ['к']; letterIndex = 0; showLetter(); });
  await page.locator('#letterShowPicture').click();
  await expect(page.locator('#letterPicture')).toHaveText('🐱');
  await page.unroute('**/assets/pictures/cat.png');
  await page.locator('#wordsTab').click();
  for (const [word, emoji, asset] of [['дом', '🏠', 'house'], ['пол', '🏠', null], ['сом', '🐟', null], ['сыр', '🧀', 'cheese']]) {
    await page.evaluate(([word, emoji]) => {
      current = [word, emoji]; render(word); renderPicture($('pic'), word, emoji); $('pic').hidden = true; resetTurn();
    }, [word, emoji]);
    await page.locator('#showPicture').click();
    if (asset) {
      const image = page.locator('#pic img');
      await expect(image).toHaveAttribute('src', `./assets/pictures/${asset}.png`);
      await expect.poll(() => image.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    } else {
      await expect(page.locator('#pic')).toHaveText(emoji);
      await expect(page.locator('#pic img')).toHaveCount(0);
    }
  }
});
