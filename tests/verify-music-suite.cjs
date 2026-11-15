const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function verifyMusicSuite() {
  console.log('================================================================');
  console.log('   FOLD: VERIFICATION OF RETRO XP MUSIC ARCHITECTURE & SUITE     ');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
    args: ['--autoplay-policy=no-user-gesture-required']
  });

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

  // 1. Initial Page Load (Video Mode - Cinema)
  console.log('\n--- 1. Initial Page Load & Zero Auto-Audio Verification ---');
  await page.goto('http://localhost:5173/preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const initialTheme = await page.evaluate(() => {
    return document.querySelector('.media-container')?.getAttribute('data-fold-theme');
  });
  assert('Default theme is Cinema', initialTheme === 'cinema', initialTheme);

  const initialExperience = await page.evaluate(() => {
    return document.querySelector('.media-container')?.getAttribute('data-fold-experience') || 'video';
  });
  assert('Default experience is Video', initialExperience === 'video', initialExperience);

  const anyAudioPlaying = await page.evaluate(() => {
    const audios = Array.from(document.querySelectorAll('audio'));
    return audios.some(a => !a.paused && a.currentTime > 0);
  });
  assert('Zero background/ambient audio playing on load', !anyAudioPlaying);

  // 2. Retro XP Video Mode Verification
  console.log('\n--- 2. Retro XP Video Mode Verification ---');
  await page.click('button.fold-theme-chip:has-text("RETRO XP")');
  await page.waitForTimeout(600);

  const retroTheme = await page.evaluate(() => {
    return document.querySelector('.media-container')?.getAttribute('data-fold-theme');
  });
  assert('Switched to Retro XP Theme', retroTheme === 'retro', retroTheme);

  const isVideoVisible = await page.evaluate(() => {
    const video = document.querySelector('video');
    if (!video) return false;
    const rect = video.getBoundingClientRect();
    const style = window.getComputedStyle(video);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
  });
  assert('Video element is visible and unobstructed in Retro XP', isVideoVisible);

  const retroAudioPlaying = await page.evaluate(() => {
    const audios = Array.from(document.querySelectorAll('audio'));
    return audios.some(a => !a.paused);
  });
  assert('No ambient audio playing in Retro XP Video Mode', !retroAudioPlaying);

  // 3. Switch to FOLD Retro Music Player
  console.log('\n--- 3. Launch FOLD Retro Music & Verify Empty State ---');
  await page.click('.fold-xp-music-switch-btn, .fold-xp-launch-music-pill');
  await page.waitForTimeout(800);

  const musicExperience = await page.evaluate(() => {
    return document.querySelector('.media-container')?.getAttribute('data-fold-experience');
  });
  assert('Active experience changed to Music', musicExperience === 'music', musicExperience);

  const videoState = await page.evaluate(() => {
    const video = document.querySelector('video');
    return {
      paused: video?.paused,
      visibility: video ? window.getComputedStyle(video).visibility : null,
    };
  });
  assert('Video is paused when entering Music Mode', videoState.paused === true);
  assert('Video is hidden when in Music Mode', videoState.visibility === 'hidden');

  const emptyHeading = await page.textContent('.fold-wmp-empty-heading');
  assert(
    'Empty state heading matches specification',
    emptyHeading?.trim() === 'Your music, your memories. Add a track to begin.',
    emptyHeading
  );

  const musicAudioState = await page.evaluate(() => {
    const audio = document.getElementById('fold-retro-music-audio');
    return {
      src: audio?.src || '',
      paused: audio?.paused ?? true,
      currentTime: audio?.currentTime || 0,
    };
  });
  assert('Music starts completely silent and paused', musicAudioState.paused === true && musicAudioState.currentTime === 0);

  // 4. Load Audio Track (Zero Auto-Play Guarantee)
  console.log('\n--- 4. Load Audio Track (Zero Auto-Play Guarantee) ---');
  await page.click('.fold-wmp-secondary-demo-btn');
  await page.waitForTimeout(800);

  const trackTitle = await page.textContent('.fold-wmp-track-title');
  assert('Track loaded into stage', trackTitle?.includes('Cosmic Ambience'), trackTitle);

  const isStillSilent = await page.evaluate(() => {
    const audio = document.getElementById('fold-retro-music-audio');
    const lcdStatus = document.querySelector('.fold-lcd-status')?.textContent;
    return {
      paused: audio?.paused,
      currentTime: audio?.currentTime,
      lcdStatus,
    };
  });
  assert('Audio remains paused after loading track (No auto-play)', isStillSilent.paused === true && isStillSilent.currentTime === 0);
  assert('LCD status reflects STANDBY/STOPPED', isStillSilent.lcdStatus === 'STOPPED' || isStillSilent.lcdStatus === 'STANDBY', isStillSilent.lcdStatus);

  // 5. Explicit Play & Classic Spectrum Visualizer
  console.log('\n--- 5. Explicit Play & Classic Spectrum Visualizer ---');
  await page.click('.fold-retro-bar .fold-xp-play-btn');
  await page.waitForTimeout(1500);

  const playingState = await page.evaluate(() => {
    const audio = document.getElementById('fold-retro-music-audio');
    const lcdStatus = document.querySelector('.fold-lcd-status')?.textContent;
    return {
      paused: audio?.paused,
      currentTime: audio?.currentTime,
      duration: audio?.duration,
      lcdStatus,
    };
  });
  assert('Audio starts playing on explicit user click', playingState.paused === false && playingState.currentTime > 0, `Time: ${playingState.currentTime?.toFixed(2)}s`);
  assert('LCD status updates to PLAYING', playingState.lcdStatus === 'PLAYING', playingState.lcdStatus);

  // 6. Visualizer Preset: Oscilloscope
  console.log('\n--- 6. Visualizer Preset: Oscilloscope ---');
  await page.click('button.fold-wmp-preset-btn:has-text("Oscilloscope")');
  await page.waitForTimeout(800);

  const visTitle = await page.textContent('.fold-vis-title');
  assert('Visualizer mode changed to Oscilloscope', visTitle?.includes('OSCILLOSCOPE'), visTitle);

  // 7. Visualizer Preset: Liquid Memory
  console.log('\n--- 7. Visualizer Preset: Liquid Memory ---');
  await page.click('button.fold-wmp-preset-btn:has-text("Liquid Memory")');
  await page.waitForTimeout(800);

  const liquidTitle = await page.textContent('.fold-vis-title');
  assert('Visualizer mode changed to Liquid Memory', liquidTitle?.includes('LIQUID MEMORY'), liquidTitle);

  // 8. Music Seeking & Timeline Scrubber
  console.log('\n--- 8. Music Seeking & Timeline Scrubber ---');
  const scrubberBox = await page.locator('.fold-xp-music-scrubber').boundingBox();
  if (scrubberBox) {
    await page.mouse.click(scrubberBox.x + scrubberBox.width * 0.5, scrubberBox.y + scrubberBox.height * 0.5);
    await page.waitForTimeout(500);

    const { seekTime, realDuration } = await page.evaluate(() => {
      const audio = document.getElementById('fold-retro-music-audio');
      return {
        seekTime: audio?.currentTime || 0,
        realDuration: audio?.duration || 31.04,
      };
    });
    const expectedSeek = realDuration * 0.5;
    const seekDiff = Math.abs(seekTime - expectedSeek);
    assert('Seeked to 50% position successfully', seekDiff < 1.5, `Seek Time: ${seekTime.toFixed(2)}s, Expected: ${expectedSeek.toFixed(2)}s, Diff: ${seekDiff.toFixed(2)}s`);
  }

  // 9. Playlist Drawer
  console.log('\n--- 9. Playlist Drawer & Multiple Tracks ---');
  await page.click('button:has-text("PLAYLIST"), button:has-text("Playlist")');
  await page.waitForTimeout(600);

  const playlistVisible = await page.isVisible('.fold-wmp-playlist-drawer');
  assert('Playlist drawer opened', playlistVisible);

  // 10. Local Audio File Upload Simulation
  console.log('\n--- 10. Local Audio File Upload Verification ---');
  const sampleWavBuffer = Buffer.from(
    'RIFF$ \x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00 \x00\x00' +
    '\x00\x00'.repeat(4000),
    'binary'
  );

  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'Daft Punk - Around The World.mp3',
    mimeType: 'audio/mpeg',
    buffer: sampleWavBuffer,
  });
  await page.waitForTimeout(800);

  const playlistCount = await page.evaluate(() => {
    return document.querySelectorAll('.fold-wmp-track-row').length;
  });
  assert('User audio file uploaded and added to playlist', playlistCount >= 2, `Total tracks: ${playlistCount}`);

  // 11. Return to Video & Mutual Exclusivity Verification
  console.log('\n--- 11. Return to Video & Mutual Exclusivity Verification ---');
  await page.click('.fold-xp-back-video-btn');
  await page.waitForTimeout(800);

  const restoredExp = await page.evaluate(() => {
    return document.querySelector('.media-container')?.getAttribute('data-fold-experience');
  });
  assert('Returned to Video Mode', restoredExp === 'video', restoredExp);

  const musicAudioPaused = await page.evaluate(() => {
    const audio = document.getElementById('fold-retro-music-audio');
    return audio?.paused ?? true;
  });
  assert('Music playback paused immediately upon returning to video', musicAudioPaused === true);

  const videoVisibleAgain = await page.evaluate(() => {
    const video = document.querySelector('video');
    return video && window.getComputedStyle(video).visibility !== 'hidden';
  });
  assert('Video element visibility restored', videoVisibleAgain === true);

  console.log('\n================================================================');
  console.log(`VERIFICATION COMPLETE: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('================================================================\n');

  await browser.close();
  if (results.failed > 0) process.exit(1);
}

verifyMusicSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
