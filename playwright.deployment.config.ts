import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/deployment', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174', channel: 'msedge', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run preview -- --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false, timeout: 30000 },
  projects: [{ name: 'deployment-desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'deployment-mobile', use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } }]
});
