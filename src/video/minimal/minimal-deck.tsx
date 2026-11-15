import {
  Controls,
  PlayButton as PlayButtonPrimitive,
  SeekButton as SeekButtonPrimitive,
  TimeSlider as TimeSliderPrimitive,
  FullscreenButton as FullscreenButtonPrimitive,
} from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import { FoldPlayIcon, FoldPauseIcon, FoldSeekBackwardIcon, FoldSeekForwardIcon, FoldFullscreenEnterIcon } from '../fold-icons';
import { FoldVolume } from '../fold-volume';
import { SharedSeekBar } from '../shared-seek-bar';
import { FoldCaptionsMenu } from '../fold-captions-menu';
import { useFoldTheme } from '../theme-context';
import type { ThumbnailSlot } from '../shared/time-slider';

function formatMinimalTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MinimalDeck({ renderThumbnail }: ThumbnailSlot = {}) {
  const { theme, setTheme, setExperience } = useFoldTheme();
  const paused = usePlayer((s) => s.paused) ?? true;
  const currentTime = usePlayer((s) => s.currentTime) ?? 0;
  const duration = usePlayer((s) => s.duration) ?? 0;

  return (
    <>
      <Controls.Backdrop className="fold-minimal-backdrop" />

      <Controls.Content className="fold-minimal-content">
        {/* Top Minimal Theme Switcher */}
        <div className="fold-minimal-topbar" role="toolbar" aria-label="Theme Selector">
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
              title="Switch to Retro XP Theme"
            >
              RETRO XP
            </button>
            <button
              type="button"
              className={`fold-theme-chip ${theme === 'minimal' ? 'is-active' : ''}`}
              onClick={() => setTheme('minimal')}
              title="Active: Minimal Theme"
            >
              MINIMAL
            </button>
          </div>

          <button
            type="button"
            className="fold-min-music-btn"
            onClick={() => setExperience('music')}
            title="Open FOLD Retro Music Player"
            aria-label="Open FOLD Retro Music Player"
          >
            🎵 RETRO MUSIC
          </button>
        </div>

        <div className="fold-minimal-spacer" />

        {/* Floating Centered Glass Dock */}
        <div className="fold-minimal-dock" role="region" aria-label="Minimal Video Controls">
          {/* Play/Pause */}
          <PlayButtonPrimitive
            className="fold-min-play-btn"
            render={(props) => (
              <button
                type="button"
                {...props}
                aria-label={paused ? 'Play' : 'Pause'}
                title={paused ? 'Play' : 'Pause'}
              >
                {paused ? <FoldPlayIcon className="fold-min-icon" /> : <FoldPauseIcon className="fold-min-icon" />}
              </button>
            )}
          />

          {/* Quick Skips */}
          <SeekButtonPrimitive
            seconds={-10}
            className="fold-min-seek-btn"
            render={(props) => (
              <button type="button" {...props} aria-label="Skip backward 10s" title="Skip -10s">
                <FoldSeekBackwardIcon className="fold-min-icon-sm" />
              </button>
            )}
          />

          <SeekButtonPrimitive
            seconds={10}
            className="fold-min-seek-btn"
            render={(props) => (
              <button type="button" {...props} aria-label="Skip forward 10s" title="Skip +10s">
                <FoldSeekForwardIcon className="fold-min-icon-sm" />
              </button>
            )}
          />

          {/* Time Readout */}
          <div className="fold-min-time" aria-label="Current time and duration">
            <span className="fold-min-cur">{formatMinimalTime(currentTime)}</span>
            <span className="fold-min-sep">/</span>
            <span className="fold-min-dur">{formatMinimalTime(duration)}</span>
          </div>

          {/* Slim Hairline Scrubber */}
          <div className="fold-min-slider-wrap">
            <SharedSeekBar variant="minimal" renderThumbnail={renderThumbnail} />
          </div>

          {/* Optics & Acoustics */}
          <div className="fold-min-actions">
            <FoldVolume compact={true} showSlider={false} />
            <FoldCaptionsMenu />
            <FullscreenButtonPrimitive
              className="fold-min-fs-btn"
              render={(props) => (
                <button type="button" {...props} aria-label="Fullscreen" title="Fullscreen">
                  <FoldFullscreenEnterIcon className="fold-min-icon-sm" />
                </button>
              )}
            />
          </div>
        </div>
      </Controls.Content>
    </>
  );
}
