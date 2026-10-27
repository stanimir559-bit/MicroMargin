import { test, expect, type Page } from '@playwright/test';
async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
}
async function nav(page: Page, name: string) {
  const selector = page.viewportSize()!.width <= 760 ? '.mobile-nav' : '.sidebar nav';
  await page.locator(selector).getByRole('button', { name, exact: true }).click();
}
test('demo → review price impact → save → persisted recipe costing', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await expect(page.getByRole('heading', { name: 'Small costs. Big difference.' })).toBeVisible();
  await page.screenshot({ path: `artifacts/screenshots/dashboard-${testInfo.project.name}.png`, fullPage: true });
  await nav(page, 'Ingredients');
  const flour = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Flour', exact: true }) });
  await flour.getByRole('button', { name: 'Change price' }).click();
  await page.getByLabel('New pack price (EUR)').fill('3,60');
  await page.getByRole('button', { name: 'Review impact', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Price change review' })).toContainText('linked recipes');
  await page.getByRole('button', { name: 'Confirm new price' }).click();
  await page.reload();
  await nav(page, 'Ingredients');
  await expect(page.locator('article').filter({ has: page.getByRole('heading', { name: 'Flour', exact: true }) })).toContainText('3.60 €');
  await nav(page, 'Recipes');
  await expect(page.getByText('Contribution margin', { exact: true })).toBeVisible();
  await expect(page.getByText('This is contribution before fixed costs, labour and taxes. It is not net profit.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
  expect(errors).toEqual([]);
});
test('new ingredient, batch recipe, loss validation and VAT profile', async ({ page }) => {
  await start(page); await nav(page, 'Ingredients');
  await page.getByRole('button', { name: 'Add ingredient', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Demo oats');
  await page.getByLabel('Supplier', { exact: true }).fill('Synthetic supplier');
  await page.getByLabel('Pack price (EUR)', { exact: true }).fill('2.40');
  await page.getByRole('button', { name: 'Save ingredient' }).click();
  await expect(page.getByRole('heading', { name: 'Demo oats' })).toBeVisible();
  await nav(page, 'Recipes'); await page.getByRole('button', { name: 'New recipe', exact: true }).click();
  await page.getByLabel('Recipe name').fill('Synthetic oat batch');
  await page.getByRole('combobox', { name: 'Ingredient 1', exact: true }).selectOption({ label: 'Demo oats' });
  await page.getByRole('textbox', { name: 'Quantity 1', exact: true }).fill('150');
  await page.getByRole('combobox', { name: 'Unit 1', exact: true }).selectOption('g');
  await page.getByLabel('Saleable portions').fill('8');
  await page.getByLabel('Ingredient loss (%)').fill('100');
  await expect(page.getByRole('button', { name: 'Save recipe' })).toBeDisabled();
  await page.getByLabel('Ingredient loss (%)').fill('0');
  await page.getByLabel('Selling price (EUR)').fill('1,250');
  await expect(page.getByText(/Ambiguous thousands separator/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save recipe' })).toBeDisabled();
  await page.getByLabel('Selling price (EUR)').fill('3');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await page.reload(); await nav(page, 'Recipes');
  await expect(page.getByRole('button', { name: 'Synthetic oat batch', exact: true })).toBeVisible();
  await nav(page, 'Settings');
  await page.getByLabel('Configured sale VAT (%)').fill('20');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.reload(); await nav(page, 'Settings');
  await expect(page.getByLabel('Configured sale VAT (%)')).toHaveValue('20');
});
test('keyboard navigation, local-only requests and narrow viewport', async ({ page }) => {
  const external: string[] = []; page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url()); });
  await page.goto('/'); await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Към съдържанието' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
  await page.getByRole('button', { name: 'Switch to English' }).click();
  for (const screen of ['Overview', 'Ingredients', 'Recipes', 'Settings']) {
    await nav(page, screen);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(external).toEqual([]);
});

test('synthetic PDF preview requires reviewed confirmation; malformed file cannot import', async ({ page }) => {
  const errors: string[] = []; const external: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url()); });
  await start(page); await nav(page, 'Invoices');
  await expect(page.getByRole('button', { name: 'Open sample invoice' })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'I am using a fictional document with no real customer data.' }).check();
  await page.getByRole('button', { name: 'Open sample invoice' }).click();
  await expect(page.getByText('synthetic-invoice.pdf · 1 pages')).toBeVisible({ timeout: 20000 });
  await page.getByText('Extracted text — unverified data').click();
  await expect(page.locator('pre')).toContainText('SYNTHETIC');
  await page.getByLabel('Catalogue ingredient').selectOption('flour');
  await page.getByLabel('Verified price for the same pack (EUR)').fill('3.60');
  await expect(page.getByRole('button', { name: 'Confirm verified price' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review price impact' }).click();
  await expect(page.getByRole('button', { name: 'Confirm verified price' })).toBeVisible();
  await page.getByLabel('Verified price for the same pack (EUR)').fill('3.70');
  await expect(page.getByRole('button', { name: 'Confirm verified price' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review price impact' }).click();
  await page.getByRole('button', { name: 'Confirm verified price' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Price updated.' })).toBeVisible();
  await page.getByLabel('Upload synthetic PDF').setInputFiles({ name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\ncorrupted synthetic content') });
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Confirm verified price' })).toHaveCount(0);
  await expect(page.getByLabel('Catalogue ingredient')).toBeDisabled();
  await nav(page, 'Ingredients');
  await expect(page.locator('article').filter({ has: page.getByRole('heading', { name: 'Flour', exact: true }) })).toContainText('3.70 €');
  expect(errors).toEqual([]); expect(external).toEqual([]);
});

test('empty local catalogue recovers through add ingredient; corrupt state is preserved', async ({ page }) => {
  await start(page);
  await page.evaluate(() => { const key = 'micromargin.state.v1'; const state = JSON.parse(localStorage.getItem(key)!); state.ingredients = []; state.recipes = []; state.snapshots = []; localStorage.setItem(key, JSON.stringify(state)); });
  await page.reload(); await nav(page, 'Recipes');
  await expect(page.getByRole('heading', { name: 'Add an ingredient first' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to ingredients' }).click();
  await expect(page.getByRole('button', { name: 'Add ingredient', exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('micromargin.state.v1', '{broken synthetic JSON'));
  await page.reload();
  await expect(page.getByRole('status')).toContainText('original data preserved');
  expect(await page.evaluate(() => localStorage.getItem('micromargin.state.v1.recovery'))).toBe('{broken synthetic JSON');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await nav(page, 'Settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery backup' }).click();
  expect((await download).suggestedFilename()).toBe('micromargin-unreadable-recovery.txt');
});
