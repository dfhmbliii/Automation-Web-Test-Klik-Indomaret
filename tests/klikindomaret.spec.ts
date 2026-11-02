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

  // Tunggu challenge Cloudflare selesai (halaman nyata baru muncul setelah ini)
  await tungguLolosCloudflare(page);
  await page.waitForSelector('text="Makanan"', { timeout: 60000 });

  // Tutup modal/pop-up jika muncul di awal
  await page.keyboard.press('Escape');
  const closePopUp = page.locator('.modal-open .close, .modal-open button, [aria-label="Close"]').first();
  if (await closePopUp.isVisible().catch(() => false)) {
    await closePopUp.click().catch(() => {});
  }

  // 2. Pilih Meta Kategori "Makanan"
  const metaMakanan = page.locator('text="Makanan"').first();
  await metaMakanan.click();

  // Tunggu navigasi selesai + lolos Cloudflare jika muncul lagi
  await page.waitForLoadState('domcontentloaded');
  await tungguLolosCloudflare(page);

  // 3. Pilih kategori "Madu" — coba berbagai selector & scroll jika perlu
  // Gunakan partial match (has-text) agar lebih toleran terhadap variasi teks
  const katMadu = page.locator('a:has-text("Madu"), span:has-text("Madu"), li:has-text("Madu")').first();

  // Scroll ke bawah perlahan agar konten lazy-load tampil
  for (let i = 0; i < 5; i++) {
    const visible = await katMadu.isVisible().catch(() => false);
    if (visible) break;
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(800);
  }

  await katMadu.waitFor({ timeout: 30000 });
  await katMadu.scrollIntoViewIfNeeded();
  await katMadu.click();

  // Tunggu navigasi ke halaman produk Madu
  await page.waitForLoadState('domcontentloaded');
  await tungguLolosCloudflare(page);

  // 4 & 5. Pilih salah satu produk Madu & Masuk ke detail produk
  const produkMadu = page.locator('.item-product, .product-collection, a[href*="/product/"]').first();
  await produkMadu.waitFor({ timeout: 30000 });
  await produkMadu.click({ force: true });

  // Tunggu halaman detail produk load
  await page.waitForLoadState('domcontentloaded');
  await tungguLolosCloudflare(page);

  // 6. Klik button "+ Keranjang"
  const btnKeranjang = page.locator('button:has-text("Keranjang"), .btn-cart, button:has-text("+ Keranjang")').first();
  await expect(btnKeranjang).toBeVisible({ timeout: 15000 });
  await btnKeranjang.click({ force: true });
});