import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

test('built app and PDF worker function with the planned Cloudflare response headers', async ({ page }) => {
  const config = readFileSync('dist/_headers', 'utf8');
  const globalBlock = config.split(/\r?\n\s*\r?\n/)[0];
  const headers = Object.fromEntries(globalBlock.split(/\r?\n/).slice(1).filter(line => line.trim()).map(line => {
    const separator = line.indexOf(':'); return [line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim()];
  }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // Vite preview doesn't interpret Cloudflare _headers. Apply the exact prepared
  // global policy to local responses, without claiming a Cloudflare deployment.
  await page.route('http://127.0.0.1:4174/**', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
  });
  const response = await page.goto('/');
  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response?.headers()['content-security-policy']).not.toContain('ws:');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  const nav = page.locator(page.viewportSize()!.width <= 760 ? '.mobile-nav' : '.sidebar nav');
  await nav.getByRole('button', { name: 'Invoices', exact: true }).click();
  await page.getByRole('checkbox', { name: 'I am using a fictional document with no real customer data.' }).check();
  await page.getByRole('button', { name: 'Open sample invoice' }).click();
  await expect(page.getByText('synthetic-invoice.pdf · 1 pages')).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('img', { name: 'Visual preview of the synthetic invoice' })).toBeVisible();
  expect(errors).toEqual([]);
});
