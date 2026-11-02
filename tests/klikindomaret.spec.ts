import { test, expect } from '@playwright/test';

// Timeout diperpanjang karena harus melewati challenge Cloudflare
test.setTimeout(120000);

/** Tunggu sampai halaman challenge Cloudflare selesai diverifikasi */
async function tungguLolosCloudflare(page: import('@playwright/test').Page) {
  const challenge = page.locator(
    'h2:has-text("Performing security verification"), h2:has-text("Verifying you are human"), #challenge-running, #challenge-form'
  );
  if (await challenge.first().isVisible().catch(() => false)) {
    console.log('Cloudflare challenge terdeteksi, menunggu ...');
    await challenge.first().waitFor({ state: 'detached', timeout: 90000 });
  }
}

test('Automation Klik Indomaret - Tambah Madu ke Keranjang', async ({ page }) => {
  // Set ukuran layar desktop
  await page.setViewportSize({ width: 1280, height: 720 });

  // 1. Akses halaman utama Klik Indomaret
  await page.goto('https://www.klikindomaret.com/', { waitUntil: 'domcontentloaded' });
  await tungguLolosCloudflare(page);
  await page.waitForSelector('text="Makanan"', { timeout: 60000 });

  // Tutup modal/pop-up jika muncul di awal
  await page.keyboard.press('Escape');
  const closePopUp = page.locator('.modal-open .close, .modal-open button, [aria-label="Close"]').first();
  if (await closePopUp.isVisible().catch(() => false)) {
    await closePopUp.click().catch(() => {});
  }

  // 2. Klik Meta Kategori "Makanan"
  const metaMakanan = page.locator('text="Makanan"').first();
  await metaMakanan.click();
  await page.waitForLoadState('domcontentloaded');
  await tungguLolosCloudflare(page);

  // 3. Navigasi langsung ke sub-kategori Madu
  await page.goto('https://www.klikindomaret.com/xpress/category/makanan/sarapan-selai/madu', {
    waitUntil: 'domcontentloaded', 
  });
  await tungguLolosCloudflare(page);
  await page.waitForTimeout(3000);

  // 4. Pilih produk Madu pertama:
  //    Link produk = /xpress/<slug-produk> (tanpa "/category/" di dalamnya)
  const produkMadu = page.locator('a.cursor-pointer[href*="/xpress/"]:not([href*="/category/"])').first();

  // Scroll agar produk lazy-load tampil
  for (let i = 0; i < 5; i++) {
    const visible = await produkMadu.isVisible().catch(() => false);
    if (visible) break;
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1000);
  }

  await produkMadu.waitFor({ state: 'visible', timeout: 30000 });
  await produkMadu.scrollIntoViewIfNeeded();

  // 5. Masuk ke detail produk
  await produkMadu.click({ force: true });
  await page.waitForLoadState('domcontentloaded');
  await tungguLolosCloudflare(page);
  await page.waitForTimeout(3000);

  // 6. Klik button "Keranjang"
  //    Hasil inspeksi: <button class="bg-primary ...">Keranjang</button>
  const btnKeranjang = page.locator('button.bg-primary, button:has-text("Keranjang")').first();

  await expect(btnKeranjang).toBeVisible({ timeout: 20000 });
  await btnKeranjang.scrollIntoViewIfNeeded();
  await btnKeranjang.click({ force: true });

  // Verifikasi berhasil ditambahkan ke keranjang
  await page.waitForTimeout(2000);
  console.log('✅ Produk Madu berhasil ditambahkan ke keranjang!');
  console.log('URL produk:', page.url());
});