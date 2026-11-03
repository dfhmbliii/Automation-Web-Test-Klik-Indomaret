import { defineConfig, devices } from '@playwright/test';

/**
 * Konfigurasi test automation Klik Indomaret.
 *
 * Catatan: situs target dilindungi Cloudflare, sehingga
 *   - lokal : dijalankan headed (challenge dilewati manual oleh manusia)
 *   - CI    : headless, dan tests/klikindomaret.spec.ts di-skip
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Gagal di CI kalau masih ada test.only yang tertinggal di source
  forbidOnly: !!process.env.CI,
  // Retry hanya di CI
  retries: process.env.CI ? 2 : 0,
  // Di CI pakai 1 worker agar laporan stabil
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30_000,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Pakai Chrome asli agar lebih sulit terdeteksi Cloudflare
        channel: 'chrome',
        // Lokal: headed (perlu melewati challenge Cloudflare)
        // CI (Linux, tanpa layar): wajib headless agar Chrome bisa jalan
        headless: !!process.env.CI,
        launchOptions: {
          args: ['--disable-blink-features=AutomationControlled'],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
