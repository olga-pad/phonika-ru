const {test,expect}=require('@playwright/test');
test('EN level 1 → 2 → 3 → 1 preserves language and mastered sounds; RU restores alphabet',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{localStorage.clear();PhonikaI18n.setLanguage('en')});
 await page.locator('#parentOpen').click();
 await expect(page.locator('#parentView')).toBeVisible();
 await expect(page.locator('#knownSounds button[data-sound="s"]')).toBeVisible();
 await page.locator('#knownSounds button[data-sound="s"]').click();
 for(const value of ['1','2','3','1']){
   await page.locator('#level').selectOption(value);
   expect(await page.evaluate(()=>PhonikaI18n.language)).toBe('en');
   expect(await page.evaluate(()=>localStorage.getItem('uiLanguage'))).toBe('en');
   expect(await page.evaluate(()=>localStorage.getItem('phonika-en-known-sounds'))).toContain('"s":true');
   await expect(page.locator('#knownSounds button[data-sound="s"]')).toHaveAttribute('aria-pressed','true');
   const labels=await page.locator('#knownSounds .known-letter').allTextContents();
   expect(labels.length).toBeGreaterThan(0);
   expect(labels.join('')).not.toMatch(/[А-Яа-яЁё]/);
 }
 await page.locator('#parentBack').click();
 await page.locator('#lettersTab').click();
 await expect(page.locator('#letterCard')).not.toContainText(/[А-Яа-яЁё]/);
 await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));
 await page.locator('#parentOpen').click();
 await expect(page.locator('#knownSounds .known-letter').first()).toBeVisible();
 expect((await page.locator('#knownSounds .known-letter').allTextContents()).join('')).toMatch(/[А-Яа-яЁё]/);
 await page.evaluate(()=>PhonikaI18n.setLanguage('en'));
 await expect(page.locator('#level')).toHaveValue('1');
 expect((await page.locator('#knownSounds .known-letter').allTextContents()).join('')).not.toMatch(/[А-Яа-яЁё]/);
});
