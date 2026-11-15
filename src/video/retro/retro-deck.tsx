import {
  Controls,
  PlayButton as PlayButtonPrimitive,
  MuteButton as MuteButtonPrimitive,
  SeekButton as SeekButtonPrimitive,
  VolumeSlider,
  FullscreenButton as FullscreenButtonPrimitive,
} from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import { SharedSeekBar } from '../shared-seek-bar';
import { FoldCaptionsMenu } from '../fold-captions-menu';
import { useFoldTheme } from '../theme-context';
import type { ThumbnailSlot } from '../shared/time-slider';

function formatSimpleTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RetroDeck({ renderThumbnail }: ThumbnailSlot = {}) {
  const { theme, setTheme, setExperience } = useFoldTheme();
  const paused = usePlayer((s) => s.paused) ?? true;
  const currentTime = usePlayer((s) => s.currentTime) ?? 0;
  const duration = usePlayer((s) => s.duration) ?? 0;
  const muted = usePlayer((s) => s.muted) ?? false;
  const volume = usePlayer((s) => s.volume) ?? 1;
  const store = usePlayer();

  return (
    <>
      <Controls.Backdrop className="fold-retro-backdrop" />

      <Controls.Content className="fold-retro-content">
        {/* Windows XP Window Title Bar */}
        <div className="fold-xp-titlebar" role="toolbar" aria-label="Windows Media Player Title Bar">
          <div className="fold-xp-title-left">
            <span className="fold-xp-wmp-icon" aria-hidden="true">▶</span>
            <span className="fold-xp-title-text">
              Windows Media Player — Cosmic Dawn (Mux HLS)
            </span>
          </div>

          <div className="fold-xp-window-controls">
            {/* Experience Switcher to FOLD Retro Music Suite */}
            <button
              type="button"
              className="fold-xp-music-switch-btn"
              onClick={() => setExperience('music')}
              title="Open FOLD Retro Music Player"
              aria-label="Open FOLD Retro Music Player"
            >
              🎵 RETRO MUSIC
            </button>

            {/* Theme Switcher Quick Toggle */}
            <div className="fold-theme-pill-select" role="group" aria-label="Select Skin Theme">
              <button
                type="button"
                className={`fold-theme-chip ${theme === 'cinema' ? 'is-active' : ''}`}
                onClick={() => setTheme('cinema')}
                title="Switch to Cinema Theme"
              >
                CINEMA
              </button>
              <button
                type="button"
                className={`fold-theme-chip ${theme === 'retro' ? 'is-active' : ''}`}
                onClick={() => setTheme('retro')}
                title="Active: Retro XP Theme"
              >
                RETRO XP
              </button>
              <button
                type="button"
                className={`fold-theme-chip ${theme === 'minimal' ? 'is-active' : ''}`}
                onClick={() => setTheme('minimal')}
                title="Switch to Minimal Theme"
              >
                MINIMAL
              </button>
            </div>

            <button type="button" className="fold-xp-win-btn fold-xp-min" aria-label="Minimize Window">_</button>
            <button type="button" className="fold-xp-win-btn fold-xp-max" aria-label="Maximize Window">□</button>
            <button type="button" className="fold-xp-win-btn fold-xp-close" aria-label="Close Window">✕</button>
          </div>
        </div>

        {/* Center Area: Completely unobstructed video viewport (no overlays covering the video!) */}
        <div className="fold-retro-center-spacer" />

        {/* Classic Retro Windows XP Playback Console Bar */}
        <div className="fold-retro-bar" role="region" aria-label="Windows Media Player Controls">
          {/* Emerald Green Digital LCD Display */}
          <div className="fold-xp-lcd-screen">
            <div className="fold-lcd-top">
              <span className="fold-lcd-status">{paused ? 'PAUSED' : 'PLAYING'}</span>
              <span className="fold-lcd-mode">VIDEO HLS</span>
            </div>
            <div className="fold-lcd-time">
              {formatSimpleTime(currentTime)} <span className="fold-lcd-dur">/ {formatSimpleTime(duration)}</span>
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="fold-xp-transport">
            <SeekButtonPrimitive
              seconds={-10}
              className="fold-xp-btn fold-xp-prev"
              render={(props) => (
                <button type="button" {...props} aria-label="Seek backward 10 seconds" title="Seek -10s">
                  ⏮
                </button>
              )}
            />

            <PlayButtonPrimitive
              className="fold-xp-play-btn"
              render={(props) => (
                <button
                  type="button"
                  {...props}
                  aria-label={paused ? 'Play' : 'Pause'}
                  title={paused ? 'Play' : 'Pause'}
                >
                  <span className="fold-xp-play-icon">{paused ? '▶' : '⏸'}</span>
                </button>
              )}
            />

            <button
              type="button"
              className="fold-xp-btn fold-xp-stop"
              onClick={() => {
                store.pause();
                store.seek(0);
              }}
              aria-label="Stop playback"
              title="Stop"
            >
              ⏹
            </button>

            <SeekButtonPrimitive
              seconds={10}
              className="fold-xp-btn fold-xp-next"
              render={(props) => (
                <button type="button" {...props} aria-label="Seek forward 10 seconds" title="Seek +10s">
                  ⏭
                </button>
              )}
            />
          </div>

          {/* Classic Track Scrubber (SharedSeekBar) */}
          <div className="fold-xp-slider-container">
            <SharedSeekBar variant="retro" renderThumbnail={renderThumbnail} />
          </div>

          {/* Actions Row */}
          <div className="fold-xp-actions">
            {/* Direct Music Mode Launch Pill */}
            <button
              type="button"
              className="fold-xp-action-pill fold-xp-launch-music-pill"
              onClick={() => setExperience('music')}
              title="Switch to FOLD Retro Music Player"
            >
              🎵 MUSIC SUITE
            </button>

            {/* Volume Control */}
            <MuteButtonPrimitive
              className="fold-xp-mute-btn"
              render={(props) => (
                <button
                  type="button"
                  {...props}
                  title={muted ? 'Unmute' : 'Mute'}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted || volume === 0 ? '🔇' : '🔊'}
                </button>
              )}
            />

            <div className="fold-xp-volume-slider-wrap">
              <VolumeSlider.Root className="fold-xp-vol-slider media-volume-slider">
                <VolumeSlider.Track className="fold-xp-vol-track media-volume-slider-track">
                  <VolumeSlider.Fill className="fold-xp-vol-fill media-volume-slider-fill" />
                </VolumeSlider.Track>
                <VolumeSlider.Thumb className="fold-xp-vol-thumb media-volume-slider-thumb" />
              </VolumeSlider.Root>
            </div>

            <FoldCaptionsMenu />

            <FullscreenButtonPrimitive
              className="fold-xp-fs-btn"
              render={(props) => (
                <button type="button" {...props} aria-label="Fullscreen" title="Fullscreen">
                  ⛶
                </button>
              )}
            />
          </div>
        </div>
      </Controls.Content>
    </>
  );
}
