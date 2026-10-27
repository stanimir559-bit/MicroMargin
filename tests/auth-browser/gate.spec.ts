import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
test('real local Worker protects every asset, signs in, loads PDF and signs out', async ({ page, context }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const html = readFileSync('dist/index.html', 'utf8');
  const mainScript = html.match(/src="([^"]+\.js)"/)![1];
  for (const path of [mainScript, '/synthetic-invoice.pdf', '/index.html']) {
    const response = await context.request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(401);
    expect(response.headers()['cache-control']).toBe('private, no-store');
  }
  await page.goto('/auth/login?lang=en');
  await expect(page.getByRole('heading', { name: 'Open your workspace' })).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('wrong-synthetic-password');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Access denied. Check the password.');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-auth-e2e-only');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();
  const cookie = (await context.cookies()).find(cookie => cookie.name === '__Host-micromargin_session')!;
  expect(cookie.httpOnly).toBe(true); expect(cookie.secure).toBe(true); expect(cookie.sameSite).toBe('Strict');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  await page.locator(page.viewportSize()!.width <= 760 ? '.mobile-nav' : '.sidebar nav').getByRole('button', { name: 'Invoices', exact: true }).click();
  await page.getByRole('checkbox', { name: 'I am using a fictional document with no real customer data.' }).check();
  await page.getByRole('button', { name: 'Open sample invoice' }).click();
  await expect(page.getByText('synthetic-invoice.pdf · 1 pages')).toBeVisible({ timeout: 20000 });
  expect((await context.request.get('/synthetic-invoice.pdf')).status()).toBe(200);
  await page.goto('/auth/login?lang=en');
  await page.getByRole('button', { name: 'End current session' }).click();
  expect((await context.request.get(mainScript, { maxRedirects: 0 })).status()).toBe(401);
  expect(errors).toEqual([]);
});
