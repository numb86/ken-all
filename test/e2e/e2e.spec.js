import { test, expect } from '@playwright/test';

test('東京・大手町（1000004）の住所が自動補完される', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('1000004');

  await expect(page.locator('#prefecture')).toHaveValue('東京都');
  await expect(page.locator('#city')).toHaveValue('千代田区');
  await expect(page.locator('#town')).toHaveValue('大手町');
});

test('大阪・梅田（5300001）の住所が自動補完される', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('5300001');

  await expect(page.locator('#prefecture')).toHaveValue('大阪府');
  await expect(page.locator('#city')).toHaveValue('大阪市北区');
  await expect(page.locator('#town')).toHaveValue('梅田');
});

test('札幌市中央区（0600000）の住所が自動補完される', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('0600000');

  await expect(page.locator('#prefecture')).toHaveValue('北海道');
  await expect(page.locator('#city')).toHaveValue('札幌市中央区');
  await expect(page.locator('#town')).toHaveValue('');
});

test('存在しない郵便番号では住所が補完されない', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('9999999');

  await expect(page.locator('#prefecture')).toHaveValue('');
  await expect(page.locator('#city')).toHaveValue('');
  await expect(page.locator('#town')).toHaveValue('');
});

test('複数の住所が紐づく郵便番号を処理できる', async ({ page }) => {
  await page.goto('/');

  // 4980000は愛知県弥富市と三重県桑名郡木曽岬町にまたがる
  await page.locator('#postal-code').fill('4980000');

  const items = page.locator('#address-list .address-item');
  await expect(items).toHaveCount(2);

  const prefectures = await items.evaluateAll((els) =>
    els.map((el) => el.dataset.prefecture)
  );
  expect(prefectures).toContain('愛知県');
  expect(prefectures).toContain('三重県');
});

test('文字を含む郵便番号はエラーになる', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('abc1234');

  await expect(page.locator('#error')).toHaveText(
    'The post code is always seven digits half-width numbers.'
  );
});

test('桁数不足の郵便番号はエラーになる', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('123');

  await expect(page.locator('#error')).toHaveText(
    'The post code is always seven digits half-width numbers.'
  );
});

test('桁数超過の郵便番号はエラーになる', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('12345678');

  await expect(page.locator('#error')).toHaveText(
    'The post code is always seven digits half-width numbers.'
  );
});

test('全角数字の郵便番号はエラーになる', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('１２３４５６７');

  await expect(page.locator('#error')).toHaveText(
    'The post code is always seven digits half-width numbers.'
  );
});

test('CDNから高速にレスポンスが返る（1秒以内）', async ({ page }) => {
  await page.goto('/');

  const start = Date.now();
  await page.locator('#postal-code').fill('1000004');
  await expect(page.locator('#prefecture')).toHaveValue('東京都');
  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThan(1000);
});

test('連続リクエストでも安定して動作する', async ({ page }) => {
  await page.goto('/');

  const codes = [
    { code: '1000004', prefecture: '東京都' },
    { code: '5300001', prefecture: '大阪府' },
    { code: '4600008', prefecture: '愛知県' },
  ];

  for (const { code, prefecture } of codes) {
    await page.locator('#postal-code').fill(code);
    await expect(page.locator('#prefecture')).toHaveValue(prefecture);
  }
});
