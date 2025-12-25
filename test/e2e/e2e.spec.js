import { test, expect } from '@playwright/test';

test('郵便番号を入力すると住所が自動補完される', async ({ page }) => {
  await page.goto('/');

  await page.locator('#postal-code').fill('1000004');
  await page.locator('#postal-code').dispatchEvent('input');

  await expect(page.locator('#prefecture')).toHaveValue('東京都');
  await expect(page.locator('#city')).toHaveValue('千代田区');
  await expect(page.locator('#town')).toHaveValue('大手町');
});
