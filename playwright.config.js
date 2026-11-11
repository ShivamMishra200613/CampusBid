import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const isExternal = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 8000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: isExternal
    ? undefined
    : [
        {
          command: 'npm run start',
          cwd: './server',
          env: {
            NODE_ENV: 'test',
            PORT: '5001',
            MONGO_URI_TEST: process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/campusbid_test',
            CLIENT_ORIGIN: 'http://localhost:5173',
            JWT_SECRET: 'e2e-test-jwt-secret-minimum-32-chars-long-123456789',
            ADMIN_EMAIL: 'admin@ves.ac.in',
            ADMIN_PASSWORD: 'change-me-admin',
            AUCTION_SWEEP_MS: '2000'
          },
          url: 'http://localhost:5001/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30000
        },
        {
          command: 'npm run dev -- --port 5173',
          cwd: './client',
          env: {
            BACKEND_PORT: '5001',
            VITE_BACKEND_URL: 'http://localhost:5001'
          },
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 30000
        }
      ]
});
