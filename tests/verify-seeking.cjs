const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runSeekingVerification() {
  console.log('====================================================');
  console.log('   FOLD: VERIFICATION OF REBUILT SHARED SEEKING     ');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const results = { passed: 0, failed: 0, tests: [] };

  const assert = (name, condition, extra = '') => {
    if (condition) {
      console.log(`  [PASS] ${name} ${extra ? `(${extra})` : ''}`);
      results.passed++;
      results.tests.push({ name, status: 'PASS', extra });
    } else {
      console.error(`  [FAIL] ${name} ${extra ? `(${extra})` : ''}`);
      results.failed++;
      results.tests.push({ name, status: 'FAIL', extra });
    }
  };

  await page.goto('http://localhost:5173/preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const duration = await page.evaluate(() => document.querySelector('video')?.duration || 111.14);
  console.log(`Loaded media duration: ${duration.toFixed(2)}s\n`);

  async function testSeek(themeName, sliderLocator, ratio, screenshotName) {
    const slider = await sliderLocator.first();
    const rect = await slider.boundingBox();
    if (!rect) {
      assert(`${themeName} slider bounding box`, false, 'not found');
      return;
    }

    const clickX = rect.x + rect.width * ratio;
    const clickY = rect.y + rect.height / 2;

    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(600);

    const actualTime = await page.evaluate(() => document.querySelector('video').currentTime);
    const expectedTime = duration * ratio;
    const diff = Math.abs(actualTime - expectedTime);

    const pass = diff < 2.0;
    assert(`${themeName} seek ${(ratio * 100).toFixed(0)}%`, pass, `Expected: ${expectedTime.toFixed(1)}s, Actual: ${actualTime.toFixed(1)}s, Diff: ${diff.toFixed(2)}s`);

    if (screenshotName) {
      const scrPath = path.join(OUT_DIR, screenshotName);
      await page.screenshot({ path: scrPath });
    }
  }

  // 1. CINEMA THEME (COMPACT & EXPANDED)
  console.log('--- 1. Testing Cinema Theme Seeking ---');
  await page.evaluate(async () => {
    const v = document.querySelector('video');
    if (v) {
      await v.play().catch(() => {});
      v.pause();
    }
  });
  await page.waitForTimeout(500);
  await testSeek('Cinema Compact', page.locator('.is-cinema .media-time-slider'), 0.25, 'cinema_25.png');
  await testSeek('Cinema Compact', page.locator('.is-cinema .media-time-slider'), 0.50, 'cinema_50.png');
  await testSeek('Cinema Compact', page.locator('.is-cinema .media-time-slider'), 0.75, 'cinema_75.png');

  // Expanded Cinema
  console.log('\n--- 2. Testing Cinema Expanded Seeking ---');
  await page.click('.fold-toggle-btn');
  await page.waitForTimeout(500);
  await testSeek('Cinema Expanded', page.locator('.is-cinema.is-expanded .media-time-slider'), 0.50, 'cinema_expanded_50.png');
  await page.click('.fold-collapse-btn');
  await page.waitForTimeout(500);

  // 2. RETRO XP THEME
  console.log('\n--- 3. Testing Retro XP Theme Seeking ---');
  await page.click('button.fold-theme-chip:has-text("RETRO XP")');
  await page.waitForTimeout(500);

  const hasHardwareSyncText = await page.evaluate(() => {
    return document.body.innerText.includes('HARDWARE A/V SYNC ACTIVE');
  });
  assert('Retro XP: Debug dashboard text completely removed', !hasHardwareSyncText);

  await testSeek('Retro XP', page.locator('.is-retro .media-time-slider'), 0.25, 'retro_25.png');
  await testSeek('Retro XP', page.locator('.is-retro .media-time-slider'), 0.50, 'retro_50.png');
  await testSeek('Retro XP', page.locator('.is-retro .media-time-slider'), 0.75, 'retro_75.png');

  // 3. MINIMAL THEME
  console.log('\n--- 4. Testing Minimal Theme Seeking ---');
  await page.click('button.fold-theme-chip:has-text("MINIMAL")');
  await page.waitForTimeout(500);

  await testSeek('Minimal', page.locator('.is-minimal .media-time-slider'), 0.25, 'minimal_25.png');
  await testSeek('Minimal', page.locator('.is-minimal .media-time-slider'), 0.50, 'minimal_50.png');
  await testSeek('Minimal', page.locator('.is-minimal .media-time-slider'), 0.75, 'minimal_75.png');

  // 4. DRAG INTERACTION
  console.log('\n--- 5. Testing Interactive Drag Seeking ---');
  await page.click('button.fold-theme-chip:has-text("CINEMA")');
  await page.waitForTimeout(500);

  const cinemaSlider = await page.locator('.is-cinema .media-time-slider').first();
  const cRect = await cinemaSlider.boundingBox();
  const dragStart = { x: cRect.x + cRect.width * 0.2, y: cRect.y + cRect.height / 2 };
  const dragEnd = { x: cRect.x + cRect.width * 0.7, y: cRect.y + cRect.height / 2 };

  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(dragEnd.x, dragEnd.y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(600);

  const dragTime = await page.evaluate(() => document.querySelector('video').currentTime);
  const expectedDrag = duration * 0.7;
  const dragDiff = Math.abs(dragTime - expectedDrag);
  assert('Drag from 20% to 70% seeks accurately', dragDiff < 2.5, `Expected: ${expectedDrag.toFixed(1)}s, Actual: ${dragTime.toFixed(1)}s`);

  // 5. SEEKING WHILE PLAYING
  console.log('\n--- 6. Testing Seeking While Playing ---');
  await page.locator('.fold-play-btn:visible').first().click();
  await page.waitForTimeout(1000);
  const isPlaying = await page.evaluate(() => !document.querySelector('video').paused);
  assert('Video is playing before seek', isPlaying);

  const midX = cRect.x + cRect.width * 0.3;
  await page.mouse.click(midX, cRect.y + cRect.height / 2);
  await page.waitForTimeout(800);

  const stillPlaying = await page.evaluate(() => !document.querySelector('video').paused);
  const timeAfterSeek = await page.evaluate(() => document.querySelector('video').currentTime);
  assert('Seeking while playing preserves playing state', stillPlaying);
  assert('Seeking while playing jumps to ~33.3s and advances', timeAfterSeek > 25 && timeAfterSeek < 40, `time=${timeAfterSeek.toFixed(1)}s`);
  assert('Seeking does NOT reset to 0', timeAfterSeek > 10);

  // 6. CAPTION TRACK EXCLUSIVITY AUDIT
  console.log('\n--- 7. Auditing All 5 Caption Tracks & Exclusivity ---');
  await page.locator('.fold-captions-trigger:visible').first().click();
  await page.waitForTimeout(500);

  const menuOptions = await page.$$eval('.fold-dropdown-item', els => els.map(e => e.textContent.trim()));
  console.log('  Caption menu options:', menuOptions);

  assert('Menu includes Off', menuOptions.some(o => o.includes('Off')));
  assert('Menu includes English', menuOptions.some(o => o.includes('English')));
  assert('Menu includes Español (Spanish)', menuOptions.some(o => o.includes('Español')));
  assert('Menu includes Français (French)', menuOptions.some(o => o.includes('Français')));
  assert('Menu includes Urdu', menuOptions.some(o => o.includes('اردو')));
  assert('Menu includes Arabic', menuOptions.some(o => o.includes('العربية')));

  console.log('  Selecting Spanish captions...');
  await page.click('.fold-dropdown-item:has-text("Español")');
  await page.waitForTimeout(600);
  let activeTracks = await page.evaluate(() => {
    return Array.from(document.querySelector('video').textTracks).filter(t => t.mode === 'showing').length;
  });
  assert('Spanish selection: exactly 1 active track', activeTracks === 1);

  console.log('  Selecting French captions...');
  await page.locator('.fold-captions-trigger:visible').first().click();
  await page.waitForTimeout(300);
  await page.click('.fold-dropdown-item:has-text("Français")');
  await page.waitForTimeout(600);
  activeTracks = await page.evaluate(() => {
    return Array.from(document.querySelector('video').textTracks).filter(t => t.mode === 'showing').length;
  });
  assert('French selection: exactly 1 active track', activeTracks === 1);

  console.log('  Selecting Urdu captions (RTL)...');
  await page.locator('.fold-captions-trigger:visible').first().click();
  await page.waitForTimeout(300);
  await page.click('.fold-dropdown-item:has-text("اردو")');
  await page.waitForTimeout(600);
  const urduActive = await page.evaluate(() => {
    const tracks = Array.from(document.querySelector('video').textTracks).filter(t => t.mode === 'showing');
    return tracks.length === 1 && tracks[0].language === 'ur';
  });
  assert('Urdu selection: exactly 1 active track with RTL', urduActive);

  console.log('  Selecting Off...');
  await page.locator('.fold-captions-trigger:visible').first().click();
  await page.waitForTimeout(300);
  await page.click('.fold-dropdown-item:has-text("Off")');
  await page.waitForTimeout(600);
  activeTracks = await page.evaluate(() => {
    return Array.from(document.querySelector('video').textTracks).filter(t => t.mode === 'showing').length;
  });
  assert('Off selection: exactly 0 active tracks', activeTracks === 0);

  console.log('\n====================================================');
  console.log(`   REBUILT SEEKING VERIFICATION: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('====================================================\n');

  await browser.close();
  if (results.failed > 0) process.exit(1);
}

runSeekingVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
