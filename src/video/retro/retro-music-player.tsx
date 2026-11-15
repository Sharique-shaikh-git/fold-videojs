import { useState, useEffect, useRef, useCallback } from 'react';
import { useFoldTheme } from '../theme-context';
import { RetroVisualizer, VisualizerPreset, resumeAudioContext } from './retro-visualizer';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  file?: File;
}

function formatAudioTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RetroMusicPlayer() {
  const { setExperience } = useFoldTheme();

  // Playlist State
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState<boolean>(false);
  const [preset, setPreset] = useState<VisualizerPreset>('spectrum');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Playback State (strictly starts paused and silent)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);

  const activeTrack = playlist[currentTrackIndex] || null;

  // Sync volume & mute to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      if (playlist[currentTrackIndex] && !playlist[currentTrackIndex].duration) {
        setPlaylist((prev) =>
          prev.map((t, idx) => (idx === currentTrackIndex ? { ...t, duration: audio.duration } : t))
        );
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => handleTrackEnded();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playlist, currentTrackIndex, repeatMode, isShuffle]);

  // Handle track ending logic
  const handleTrackEnded = () => {
    if (playlist.length === 0) return;

    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    if (isShuffle && playlist.length > 1) {
      let nextIdx = Math.floor(Math.random() * playlist.length);
      while (nextIdx === currentTrackIndex) {
        nextIdx = Math.floor(Math.random() * playlist.length);
      }
      selectTrack(nextIdx, true);
      return;
    }

    if (currentTrackIndex < playlist.length - 1) {
      selectTrack(currentTrackIndex + 1, true);
    } else if (repeatMode === 'all') {
      selectTrack(0, true);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Play / Pause explicit user toggle
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    resumeAudioContext();

    if (audio.paused) {
      audio.play().catch((err) => {
        console.warn('Playback prevented by browser policy:', err);
      });
    } else {
      audio.pause();
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handlePrev = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (playlist.length <= 1) {
      audio.currentTime = 0;
      return;
    }

    const prevIdx = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    selectTrack(prevIdx, isPlaying);
  };

  const handleNext = () => {
    if (playlist.length <= 1) return;
    if (isShuffle) {
      let nextIdx = Math.floor(Math.random() * playlist.length);
      while (nextIdx === currentTrackIndex) {
        nextIdx = Math.floor(Math.random() * playlist.length);
      }
      selectTrack(nextIdx, isPlaying);
    } else {
      const nextIdx = currentTrackIndex === playlist.length - 1 ? 0 : currentTrackIndex + 1;
      selectTrack(nextIdx, isPlaying);
    }
  };

  // Select a track from playlist
  const selectTrack = (index: number, shouldPlay: boolean = false) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrentTrackIndex(index);

    const audio = audioRef.current;
    if (!audio) return;

    const track = playlist[index];
    audio.src = track.url;
    audio.currentTime = 0;
    setCurrentTime(0);

    if (shouldPlay) {
      resumeAudioContext();
      audio.play().catch(() => {});
    } else {
      setIsPlaying(false);
    }
  };

  // Process uploaded audio files
  const handleFiles = (files: FileList | File[]) => {
    const newTracks: AudioTrack[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) {
        return;
      }

      // Parse metadata from filename
      let title = file.name.replace(/\.[^/.]+$/, '');
      let artist = 'Local Audio';

      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const url = URL.createObjectURL(file);
      newTracks.push({
        id: Math.random().toString(36).substring(2, 9),
        title,
        artist,
        url,
        duration: 0,
        file,
      });
    });

    if (newTracks.length > 0) {
      setPlaylist((prev) => {
        const updated = [...prev, ...newTracks];
        // If playlist was previously empty, point to first track, but DO NOT AUTO-PLAY
        if (prev.length === 0) {
          setCurrentTrackIndex(0);
          if (audioRef.current) {
            audioRef.current.src = newTracks[0].url;
            audioRef.current.currentTime = 0;
          }
        }
        return updated;
      });
    }
  };

  // Load sample demo track on user request (WITHOUT auto-playing)
  const handleLoadDemo = () => {
    const demoTrack: AudioTrack = {
      id: 'cosmic-ambience-demo',
      title: 'Cosmic Ambience (NASA Deep Space)',
      artist: 'NASA Sound Collection',
      url: '/cosmic-ambience.wav',
      duration: 120,
    };

    setPlaylist((prev) => {
      const exists = prev.some((t) => t.id === demoTrack.id);
      if (exists) return prev;
      const updated = [...prev, demoTrack];
      if (prev.length === 0) {
        setCurrentTrackIndex(0);
        if (audioRef.current) {
          audioRef.current.src = demoTrack.url;
          audioRef.current.currentTime = 0;
        }
      }
      return updated;
    });
  };

  // Return to video player
  const handleReturnToVideo = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
    setExperience('video');
  };

  // Interactive seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetTime = (clickX / rect.width) * duration;

    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverX(x);
    setHoverTime((x / rect.width) * duration);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  // Drag and Drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeTrack = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setPlaylist((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (index === currentTrackIndex) {
        if (updated.length > 0) {
          const nextIdx = Math.min(index, updated.length - 1);
          setCurrentTrackIndex(nextIdx);
          if (audioRef.current) {
            audioRef.current.src = updated[nextIdx].url;
            audioRef.current.currentTime = 0;
          }
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
          }
          setIsPlaying(false);
          setCurrentTime(0);
          setDuration(0);
        }
      } else if (index < currentTrackIndex) {
        setCurrentTrackIndex((i) => i - 1);
      }
      return updated;
    });
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fold-retro-music-suite"
      role="region"
      aria-label="Windows Media Player Retro Music Suite"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Hidden dedicated audio element */}
      <audio
        ref={audioRef}
        id="fold-retro-music-audio"
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {/* Windows XP Luna Blue & Silver Window Title Bar */}
      <div className="fold-xp-titlebar" role="toolbar" aria-label="Windows Media Player Music Title Bar">
        <div className="fold-xp-title-left">
          <span className="fold-xp-wmp-icon" aria-hidden="true">▶</span>
          <span className="fold-xp-title-text">
            Windows Media Player — FOLD Retro Music
          </span>
        </div>

        <div className="fold-xp-window-controls">
          <button
            type="button"
            className="fold-xp-back-video-btn"
            onClick={handleReturnToVideo}
            title="Return to Video Player"
            aria-label="Return to Video Player"
          >
            🎬 RETURN TO VIDEO
          </button>

          <button
            type="button"
            className="fold-xp-win-btn fold-xp-min"
            onClick={handleReturnToVideo}
            aria-label="Minimize Window (Return to Video)"
          >
            _
          </button>
          <button
            type="button"
            className="fold-xp-win-btn fold-xp-max"
            onClick={() => {
              const el = document.querySelector('.media-container');
              if (el) {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                } else {
                  el.requestFullscreen().catch(() => {});
                }
              }
            }}
            aria-label="Maximize Fullscreen"
          >
            □
          </button>
          <button
            type="button"
            className="fold-xp-win-btn fold-xp-close"
            onClick={handleReturnToVideo}
            aria-label="Close Music Player (Return to Video)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* WMP Classic Menu & Toolbar */}
      <div className="fold-wmp-menubar">
        <div className="fold-wmp-menu-left">
          <button
            type="button"
            className="fold-wmp-menu-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Open local audio files (MP3, WAV, FLAC, OGG)"
          >
            📂 Open Audio Files...
          </button>
          <button
            type="button"
            className="fold-wmp-menu-btn"
            onClick={handleLoadDemo}
            title="Load demo audio without playing"
          >
            🎶 Load Demo Track
          </button>
          <button
            type="button"
            className={`fold-wmp-menu-btn ${showPlaylistDrawer ? 'is-active' : ''}`}
            onClick={() => setShowPlaylistDrawer((v) => !v)}
            title="Toggle Playlist Drawer"
            aria-pressed={showPlaylistDrawer}
          >
            📋 Playlist ({playlist.length})
          </button>
        </div>

        {/* Visualizer Preset Switcher in Menu Bar */}
        <div className="fold-wmp-menu-right">
          <span className="fold-wmp-menu-label">VISUALIZER:</span>
          <button
            type="button"
            className={`fold-wmp-preset-btn ${preset === 'spectrum' ? 'is-active' : ''}`}
            onClick={() => setPreset('spectrum')}
            title="Classic Spectrum Frequency Bars"
          >
            Spectrum
          </button>
          <button
            type="button"
            className={`fold-wmp-preset-btn ${preset === 'oscilloscope' ? 'is-active' : ''}`}
            onClick={() => setPreset('oscilloscope')}
            title="Phosphor Oscilloscope CRT"
          >
            Oscilloscope
          </button>
          <button
            type="button"
            className={`fold-wmp-preset-btn ${preset === 'liquid' ? 'is-active' : ''}`}
            onClick={() => setPreset('liquid')}
            title="Liquid Memory Psychedelic Mandala"
          >
            Liquid Memory
          </button>
        </div>
      </div>

      {/* Center Stage: Empty State OR Live Visualizer & Active Track */}
      <div className={`fold-wmp-center-stage ${isDragOver ? 'is-drag-over' : ''}`}>
        {playlist.length === 0 ? (
          /* Empty State as explicitly requested */
          <div className="fold-wmp-empty-state" role="status">
            <div className="fold-wmp-vinyl-art" aria-hidden="true">
              <div className="fold-wmp-disc">
                <div className="fold-wmp-disc-grooves" />
                <div className="fold-wmp-disc-center">
                  <span className="fold-wmp-disc-logo">FOLD</span>
                </div>
              </div>
            </div>

            <h2 className="fold-wmp-empty-heading">
              Your music, your memories. Add a track to begin.
            </h2>
            <p className="fold-wmp-empty-sub">
              Drag and drop local MP3, WAV, FLAC, OGG, or AAC files anywhere, or browse your files.
            </p>

            <div className="fold-wmp-empty-actions">
              <button
                type="button"
                className="fold-wmp-primary-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📂 Select Audio Files
              </button>
              <button
                type="button"
                className="fold-wmp-secondary-demo-btn"
                onClick={handleLoadDemo}
              >
                🎶 Load Demo Audio Track
              </button>
            </div>
          </div>
        ) : (
          /* Active Playing Stage with Visualizer and Track Card */
          <div className="fold-wmp-stage-content">
            {/* Active Track Header Badge */}
            <div className="fold-wmp-track-meta-badge">
              <div className="fold-wmp-meta-left">
                <span className="fold-wmp-track-title">{activeTrack?.title || 'Unknown Track'}</span>
                <span className="fold-wmp-track-artist">{activeTrack?.artist || 'Unknown Artist'}</span>
              </div>
              <div className="fold-wmp-meta-right">
                <span className="fold-wmp-audio-badge">STEREO • 44.1 kHz • AUDIO STREAM</span>
                <span className="fold-wmp-track-num">
                  TRACK {currentTrackIndex + 1} OF {playlist.length}
                </span>
              </div>
            </div>

            {/* Real Web Audio Canvas Visualizer */}
            <div className="fold-wmp-visualizer-wrap">
              <RetroVisualizer
                preset={preset}
                onPresetChange={setPreset}
                audioElementId="fold-retro-music-audio"
                isPlaying={isPlaying}
              />
            </div>
          </div>
        )}

        {/* Collapsible Playlist Drawer */}
        {showPlaylistDrawer && (
          <aside className="fold-wmp-playlist-drawer" aria-label="Audio Playlist">
            <div className="fold-wmp-drawer-header">
              <span className="fold-wmp-drawer-title">NOW PLAYING PLAYLIST</span>
              <div className="fold-wmp-drawer-actions">
                <button
                  type="button"
                  className="fold-wmp-drawer-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Add files"
                >
                  + Add
                </button>
                <button
                  type="button"
                  className="fold-wmp-drawer-btn"
                  onClick={() => {
                    handleStop();
                    setPlaylist([]);
                  }}
                  title="Clear playlist"
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="fold-wmp-drawer-close"
                  onClick={() => setShowPlaylistDrawer(false)}
                  aria-label="Close playlist drawer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="fold-wmp-drawer-list" role="list">
              {playlist.length === 0 ? (
                <div className="fold-wmp-drawer-empty">Playlist is empty.</div>
              ) : (
                playlist.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <div
                      key={track.id}
                      role="listitem"
                      className={`fold-wmp-track-row ${isCurrent ? 'is-active' : ''}`}
                      onClick={() => selectTrack(idx, true)}
                    >
                      <span className="fold-wmp-row-num">
                        {isCurrent && isPlaying ? '▶' : `${idx + 1}.`}
                      </span>
                      <div className="fold-wmp-row-info">
                        <span className="fold-wmp-row-title">{track.title}</span>
                        <span className="fold-wmp-row-artist">{track.artist}</span>
                      </div>
                      <span className="fold-wmp-row-dur">
                        {track.duration ? formatAudioTime(track.duration) : '--:--'}
                      </span>
                      <button
                        type="button"
                        className="fold-wmp-row-remove"
                        onClick={(e) => removeTrack(e, idx)}
                        title="Remove track"
                        aria-label={`Remove ${track.title}`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Classic Windows XP Windows Media Player Playback Console Bar */}
      <footer className="fold-retro-bar" role="region" aria-label="Windows Media Player Audio Transport">
        {/* Emerald Green Digital LCD Display */}
        <div className="fold-xp-lcd-screen">
          <div className="fold-lcd-top">
            <span className="fold-lcd-status">
              {playlist.length === 0
                ? 'STANDBY'
                : isPlaying
                ? 'PLAYING'
                : currentTime > 0
                ? 'PAUSED'
                : 'STOPPED'}
            </span>
            <span className="fold-lcd-mode">AUDIO CD</span>
          </div>
          <div className="fold-lcd-time">
            {formatAudioTime(currentTime)}{' '}
            <span className="fold-lcd-dur">/ {formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Primary Audio Transport Buttons */}
        <div className="fold-xp-transport">
          <button
            type="button"
            className={`fold-xp-btn fold-xp-shuffle-btn ${isShuffle ? 'is-active' : ''}`}
            onClick={() => setIsShuffle((v) => !v)}
            title={`Shuffle: ${isShuffle ? 'ON' : 'OFF'}`}
            aria-pressed={isShuffle}
          >
            🔀
          </button>

          <button
            type="button"
            className={`fold-xp-btn fold-xp-repeat-btn ${repeatMode !== 'off' ? 'is-active' : ''}`}
            onClick={() =>
              setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'))
            }
            title={`Repeat: ${repeatMode.toUpperCase()}`}
            aria-label={`Repeat mode: ${repeatMode}`}
          >
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </button>

          <button
            type="button"
            className="fold-xp-btn fold-xp-prev"
            onClick={handlePrev}
            aria-label="Previous track"
            title="Previous track"
            disabled={playlist.length === 0}
          >
            ⏮
          </button>

          {/* Large Glossy Blue XP Play/Pause Button */}
          <button
            type="button"
            className="fold-xp-play-btn"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
            disabled={playlist.length === 0}
          >
            <span className="fold-xp-play-icon">{isPlaying ? '⏸' : '▶'}</span>
          </button>

          <button
            type="button"
            className="fold-xp-btn fold-xp-stop"
            onClick={handleStop}
            aria-label="Stop playback"
            title="Stop playback"
            disabled={playlist.length === 0}
          >
            ⏹
          </button>

          <button
            type="button"
            className="fold-xp-btn fold-xp-next"
            onClick={handleNext}
            aria-label="Next track"
            title="Next track"
            disabled={playlist.length === 0}
          >
            ⏭
          </button>
        </div>

        {/* Time Scrubber Slider */}
        <div className="fold-xp-slider-container">
          <div
            ref={progressBarRef}
            className="fold-xp-music-scrubber"
            onClick={handleSeek}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            role="slider"
            aria-label="Audio timeline"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime}
            aria-valuetext={formatAudioTime(currentTime)}
            tabIndex={0}
            onKeyDown={(e) => {
              const audio = audioRef.current;
              if (!audio || duration <= 0) return;
              if (e.key === 'ArrowRight') {
                audio.currentTime = Math.min(duration, audio.currentTime + 5);
              } else if (e.key === 'ArrowLeft') {
                audio.currentTime = Math.max(0, audio.currentTime - 5);
              }
            }}
          >
            <div className="fold-xp-music-track">
              <div
                className="fold-xp-music-fill"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
              <div
                className="fold-xp-music-thumb"
                style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>

            {hoverTime !== null && (
              <div
                className="fold-xp-scrubber-hover-pill"
                style={{ left: `${hoverX}px` }}
                aria-hidden="true"
              >
                {formatAudioTime(hoverTime)}
              </div>
            )}
          </div>
        </div>

        {/* Acoustics & Volume */}
        <div className="fold-xp-actions">
          <button
            type="button"
            className="fold-xp-mute-btn"
            onClick={() => setIsMuted((v) => !v)}
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? '🔇' : '🔊'}
          </button>

          <div className="fold-xp-volume-slider-wrap">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="fold-xp-music-vol-input"
              aria-label="Volume slider"
            />
          </div>

          <button
            type="button"
            className="fold-xp-action-pill"
            onClick={() => setShowPlaylistDrawer((v) => !v)}
            title="Toggle playlist drawer"
          >
            PLAYLIST
          </button>
        </div>
      </footer>
    </div>
  );
}
