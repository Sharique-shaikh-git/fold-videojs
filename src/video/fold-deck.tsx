import { useState, useEffect, useCallback } from 'react';
import { Controls, SeekButton as SeekButtonPrimitive } from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import type { ThumbnailSlot } from './shared/time-slider';
import { FoldPlayButton } from './fold-play-button';
import { FoldTimecode } from './fold-timecode';
import { SharedSeekBar } from './shared-seek-bar';
import { FoldVolume } from './fold-volume';
import { FoldSpeedSelector } from './fold-speed-selector';
import { FoldFullscreenButton, FoldPipButton } from './fold-screen-controls';
import { FoldCaptionsMenu } from './fold-captions-menu';
import { FoldCreativeTools } from './fold-creative-tools';
import { FoldTelemetry } from './fold-telemetry';
import { FoldCreaseIcon, FoldSeekBackwardIcon, FoldSeekForwardIcon, FoldRestartIcon } from './fold-icons';
import { SettingsMenu } from './shared/settings-menu';
import { Title } from './shared/title';
import { ScreenControls } from './shared/screen-controls';
import { VideoBufferingIndicator } from './shared/video-feedback';
import { useFoldTheme } from './theme-context';
import { cn } from '@/lib/resolve-class-name';

export function FoldDeck({ renderThumbnail }: ThumbnailSlot = {}) {
  const { theme, setTheme, setExperience } = useFoldTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const paused = usePlayer((s) => s.paused) ?? true;
  const store = usePlayer();

  const toggleFold = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        e.stopPropagation();
      } else if (e.key === 'o' || e.key === 'O') {
        setIsExpanded((prev) => !prev);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <>
      {/* Non-linear cinema dark scrim over video for >7:1 contrast on all scenes */}
      <Controls.Backdrop className="fold-backdrop" />
      <VideoBufferingIndicator />

      <Controls.Content
        className={cn('fold-controls-root', isExpanded && 'is-fold-expanded')}
        data-fold-expanded={isExpanded || undefined}
      >
        {/* Top Editorial Cinema Rail */}
        <header className="fold-top-rail" role="toolbar" aria-label="Cinema Header Toolbar">
          <div className="fold-top-meta">
            <span className="fold-editorial-badge" aria-hidden="true">
              <span className="fold-tally-dot" />
              CINEMA DCI
            </span>
            <Title />
          </div>
          <div className="fold-top-actions">
            <div className="fold-theme-pill-select" role="group" aria-label="Select Skin Theme">
              <button
                type="button"
                className={cn('fold-theme-chip', theme === 'cinema' && 'is-active')}
                onClick={() => setTheme('cinema')}
                title="Active: Cinema Theme"
              >
                CINEMA
              </button>
              <button
                type="button"
                className={cn('fold-theme-chip', theme === 'retro' && 'is-active')}
                onClick={() => setTheme('retro')}
                title="Switch to Retro XP Theme"
              >
                RETRO XP
              </button>
              <button
                type="button"
                className={cn('fold-theme-chip', theme === 'minimal' && 'is-active')}
                onClick={() => setTheme('minimal')}
                title="Switch to Minimal Theme"
              >
                MINIMAL
              </button>
            </div>
            <button
              type="button"
              className="fold-experience-chip"
              onClick={() => setExperience('music')}
              title="Open FOLD Retro Music Player"
              aria-label="Open FOLD Retro Music Player"
            >
              🎵 RETRO MUSIC
            </button>
            <ScreenControls />
          </div>
        </header>

        {/* Center Canvas Area (unobstructed video viewport) */}
        <div className="fold-center-spacer" />

        {/* The Folding Deck Surface */}
        <section
          id="fold-deck-surface"
          className={cn('fold-deck-surface', isExpanded ? 'is-expanded' : 'is-compact')}
          role="region"
          aria-label="FOLD Living Cinema Interface Deck"
        >
          {/* ========================================================================= */}
          {/* EXPANDED STATE: The Architectural Cinema Command Console                  */}
          {/* ========================================================================= */}
          {isExpanded && (
            <div className="fold-expanded-deck" id="fold-expanded-deck">
              {/* Telemetry Header & Close Action */}
              <div className="fold-expanded-header">
                <FoldTelemetry />

                <div className="fold-header-actions">
                  <FoldCreativeTools />
                  <button
                    type="button"
                    className="fold-collapse-btn"
                    onClick={toggleFold}
                    aria-expanded={isExpanded}
                    aria-controls="fold-expanded-deck"
                    aria-label="Collapse cinema control deck (Esc)"
                    title="Collapse cinema deck (Esc or 'o')"
                  >
                    <span className="fold-collapse-label">FOLD DECK</span>
                    <FoldCreaseIcon expanded={true} className="fold-collapse-icon" />
                  </button>
                </div>
              </div>

              {/* The Master Film Ruler Scrubber */}
              <div className="fold-expanded-ruler-block">
                <div className="fold-ruler-header">
                  <span className="fold-ruler-title">FILM TIMELINE RULER</span>
                  <FoldTimecode fps={24} className="fold-ruler-tc" />
                </div>
                <SharedSeekBar variant="cinema" renderThumbnail={renderThumbnail} expanded={true} />
              </div>

              {/* Seamless Unified Console Surface (Divided by precision hairlines) */}
              <div className="fold-expanded-console">
                {/* Section 1: Master Transport */}
                <div className="fold-console-section fold-sec-transport">
                  <div className="fold-sec-label">
                    <span>TRANSPORT</span>
                    <span className={cn('fold-status-badge', paused ? 'is-paused' : 'is-running')}>
                      <span className="fold-status-dot" />
                      {paused ? 'HALT' : 'RUN'}
                    </span>
                  </div>
                  <div className="fold-sec-controls">
                    <SeekButtonPrimitive
                      seconds={-10}
                      className="fold-tool-btn"
                      render={(props) => (
                        <button type="button" {...props} aria-label="Skip backward 10 seconds">
                          <FoldSeekBackwardIcon className="fold-icon" />
                          <span className="fold-tool-sub">-10S</span>
                        </button>
                      )}
                    />

                    <FoldPlayButton size="large" showLabel={true} />

                    <SeekButtonPrimitive
                      seconds={10}
                      className="fold-tool-btn"
                      render={(props) => (
                        <button type="button" {...props} aria-label="Skip forward 10 seconds">
                          <FoldSeekForwardIcon className="fold-icon" />
                          <span className="fold-tool-sub">+10S</span>
                        </button>
                      )}
                    />

                    <button
                      type="button"
                      className="fold-tool-btn fold-restart-head-btn"
                      onClick={() => store.seek(0)}
                      title="Seek to beginning (00:00:00)"
                      aria-label="Seek to start of media"
                    >
                      <FoldRestartIcon className="fold-icon" />
                      <span className="fold-tool-sub">HEAD</span>
                    </button>
                  </div>
                </div>

                <div className="fold-sec-divider" aria-hidden="true" />

                {/* Section 2: Acoustics & Calibrated Gain */}
                <div className="fold-console-section fold-sec-audio">
                  <div className="fold-sec-label">
                    <span>ACOUSTICS</span>
                    <span className="fold-sec-sub">CALIBRATED GAIN</span>
                  </div>
                  <div className="fold-sec-controls">
                    <FoldVolume compact={false} showSlider={true} />
                  </div>
                </div>

                <div className="fold-sec-divider" aria-hidden="true" />

                {/* Section 3: Cadence & Speed Matrix */}
                <div className="fold-console-section fold-sec-cadence">
                  <div className="fold-sec-label">
                    <span>CADENCE</span>
                    <span className="fold-sec-sub">PLAYBACK RATE</span>
                  </div>
                  <div className="fold-sec-controls">
                    <FoldSpeedSelector />
                  </div>
                </div>

                <div className="fold-sec-divider" aria-hidden="true" />

                {/* Section 4: Optics & Multilingual Subtitles */}
                <div className="fold-console-section fold-sec-optics">
                  <div className="fold-sec-label">
                    <span>OPTICS</span>
                    <span className="fold-sec-sub">PROJECTION & CC</span>
                  </div>
                  <div className="fold-sec-controls fold-optics-row">
                    <FoldCaptionsMenu />
                    <FoldPipButton />
                    <SettingsMenu />
                    <FoldFullscreenButton />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* COMPACT STATE: The Sleek Minimal Cinema Transport Bar                      */}
          {/* ========================================================================= */}
          {!isExpanded && (
            <div className="fold-compact-bar">
              {/* Primary Transport & Timecode */}
              <div className="fold-compact-left">
                <FoldPlayButton size="normal" />
                <SeekButtonPrimitive
                  seconds={-10}
                  className="fold-compact-seek"
                  render={(props) => (
                    <button type="button" {...props} aria-label="Skip backward 10 seconds" title="Skip -10s">
                      <FoldSeekBackwardIcon className="fold-icon fold-icon-compact" />
                    </button>
                  )}
                />
                <SeekButtonPrimitive
                  seconds={10}
                  className="fold-compact-seek"
                  render={(props) => (
                    <button type="button" {...props} aria-label="Skip forward 10 seconds" title="Skip +10s">
                      <FoldSeekForwardIcon className="fold-icon fold-icon-compact" />
                    </button>
                  )}
                />
                <FoldTimecode fps={24} />
              </div>

              {/* Integrated Slim Scrubber Ruler */}
              <div className="fold-compact-center">
                <SharedSeekBar variant="cinema" renderThumbnail={renderThumbnail} expanded={false} />
              </div>

              {/* Optics, Volume, Creative Tools and Signature FOLD Toggle */}
              <div className="fold-compact-right">
                <FoldVolume compact={true} showSlider={false} />
                <FoldCaptionsMenu />
                <SettingsMenu />

                {/* THE SIGNATURE FOLD TOGGLE BUTTON */}
                <button
                  type="button"
                  className="fold-toggle-btn"
                  onClick={toggleFold}
                  aria-expanded={isExpanded}
                  aria-controls="fold-expanded-deck"
                  aria-label="Expand FOLD cinema console deck ('o')"
                  title="Expand FOLD cinema console deck ('o')"
                >
                  <span className="fold-toggle-badge">FOLD</span>
                  <FoldCreaseIcon expanded={isExpanded} className="fold-toggle-chevron" />
                </button>

                <FoldFullscreenButton />
              </div>
            </div>
          )}
        </section>
      </Controls.Content>
    </>
  );
}
