import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/auth-browser', workers: 1,
  use: { baseURL: 'https://localhost:8787', channel: 'msedge', ignoreHTTPSErrors: true, screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/auth-test-server.mjs', url: 'https://localhost:8787/auth/login', ignoreHTTPSErrors: true, reuseExistingServer: false, timeout: 45000 },
  projects: [{ name: 'auth-desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'auth-mobile', use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } }]
});
