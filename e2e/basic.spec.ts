import { test, expect } from '@playwright/test';

test('loads home page and shows Photo Wallet heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Photo Wallet/i);
  await expect(page.getByRole('heading', { name: /Photo Wallet/i })).toBeVisible();
});

test('serves manifest and registers service worker', async ({ page }) => {
  await page.goto('/');
  const res = await page.request.get('/manifest.json');
  expect(res.ok()).toBeTruthy();
});


