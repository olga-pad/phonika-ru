const {test,expect}=require('@playwright/test');
test('Parent Mode known sounds explanation follows RU → EN → FR → RU without Russian signs in translations',async({page})=>{
 await page.goto('./');
 await page.locator('#parentOpen').click();
 await expect(page.locator('#parentView')).toBeVisible();
 const description=page.locator('#parentView .tone-known .collapse-body > p.intro');
 const switchTo=async language=>{
  await page.locator('.parent-language-option').filter({hasText:new RegExp('^'+language+'$')}).click();
  await expect(page.locator('.parent-language-option.active')).toHaveText(language);
  await expect(page.locator('html')).toHaveAttribute('lang',language.toLowerCase());
 };
 await switchTo('RU');
 await expect(description).toContainText('Ь и Ъ');
 await switchTo('EN');
 await expect(description).toHaveText('Mark the sounds your child already knows. These sounds will be considered mastered and used to unlock words your child can read.');
 await expect(description).not.toContainText(/[ьъЬЪ]/);
 await switchTo('FR');
 await expect(description).toHaveText('Cochez les sons que votre enfant connaît déjà. Ces sons seront considérés comme maîtrisés et permettront de débloquer les mots que votre enfant peut lire.');
 await expect(description).not.toContainText(/[ьъЬЪ]/);
 await switchTo('RU');
 await expect(description).toContainText('Ь и Ъ');
});
