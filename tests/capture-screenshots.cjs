const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, 'docs', 'screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('Capturing competition-grade high-resolution screenshots...');
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 675 },
    deviceScaleFactor: 2, // High-DPI crisp Retina rendering
  });

  const page = await context.newPage();

  // Load preview.html (which embeds only the player without workbench panels)
  await page.goto('http://localhost:5173/preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Play and seek to an iconic NASA launch frame
  await page.evaluate(async () => {
    const v = document.querySelector('video');
    if (v) {
      v.muted = true;
      await v.play().catch(() => {});
      v.currentTime = 55.6; // shuttle ascent flame
      await new Promise(r => setTimeout(r, 600));
      v.pause();
    }
  });
  await page.waitForTimeout(1000);

  const playerEl = page.locator('.media-container');

  // 1. Cinema Skin (Expanded)
  console.log('1. Capturing Cinema Skin (Expanded)...');
  await page.click('.fold-theme-chip:has-text("CINEMA")');
  await page.waitForTimeout(500);
  // Expand the director's console deck
  await page.click('.fold-toggle-btn');
  await page.waitForTimeout(800);
  await playerEl.screenshot({
    path: path.join(OUT_DIR, 'cinema.png'),
  });
  console.log('   Saved: docs/screenshots/cinema.png');

  // 2. Retro XP Video Skin
  console.log('2. Capturing Retro XP Video Skin...');
  await page.click('.fold-collapse-btn').catch(() => {});
  await page.waitForTimeout(400);
  await page.click('.fold-theme-chip:has-text("RETRO XP")');
  await page.waitForTimeout(800);
  await playerEl.screenshot({
    path: path.join(OUT_DIR, 'retro-xp.png'),
  });
  console.log('   Saved: docs/screenshots/retro-xp.png');

  // 3. Minimal Video Skin
  console.log('3. Capturing Minimal Video Skin...');
  await page.click('.fold-theme-chip:has-text("MINIMAL")');
  await page.waitForTimeout(800);
  await playerEl.screenshot({
    path: path.join(OUT_DIR, 'minimal.png'),
  });
  console.log('   Saved: docs/screenshots/minimal.png');

  // 4. FOLD Music (Real Web Audio Reactive Spectrum Visualizer)
  console.log('4. Capturing FOLD Retro Music (Audio-Reactive Spectrum)...');
  await page.click('button:has-text("RETRO MUSIC")');
  await page.waitForTimeout(800);

  // Load demo track into stage
  await page.click('.fold-wmp-secondary-demo-btn, button:has-text("Load Demo Track")');
  await page.waitForTimeout(600);

  // Ensure Spectrum preset
  await page.click('button.fold-wmp-preset-btn:has-text("Spectrum")').catch(() => {});

  // Click play to generate active real-time FFT frequency spectrum
  await page.click('.fold-retro-bar .fold-xp-play-btn');
  await page.waitForTimeout(1800); // Allow FFT animation to render full colorful bars and floating caps

  await playerEl.screenshot({
    path: path.join(OUT_DIR, 'music-spectrum.png'),
  });
  console.log('   Saved: docs/screenshots/music-spectrum.png');

  await browser.close();
  console.log('All 4 release screenshots captured successfully!');
}

captureScreenshots().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
