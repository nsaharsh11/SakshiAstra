import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 45_000,
  use: { baseURL: 'http://127.0.0.1:5174', channel: 'chrome', reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: 'npm run preview -- --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174', reuseExistingServer: false,
  },
});
