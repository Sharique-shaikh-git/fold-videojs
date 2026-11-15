import { useState, useEffect, useRef, useCallback } from 'react';
import { FoldCaptionsIcon } from './fold-icons';
import { cn } from '@/lib/resolve-class-name';

interface TrackItem {
  id: string;
  label: string;
  language: string;
  isRtl?: boolean;
}

// Module-level persistent language state across skin switches ('off', 'en', 'ur', 'ar')
let persistentSelectedLang = 'off';

export function FoldCaptionsMenu({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [activeLang, setActiveLang] = useState<string>(persistentSelectedLang);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Apply strict single-track exclusivity
  const applyTrackSelection = useCallback((targetLang: string) => {
    const video = document.querySelector('video');
    if (!video || !video.textTracks) return;

    persistentSelectedLang = targetLang;
    setActiveLang(targetLang);

    let targetIsRtl = false;
    let activated = false;

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (track.kind === 'subtitles' || track.kind === 'captions') {
        const lang = track.language || track.label.toLowerCase().slice(0, 2);
        const isGenerated =
          track.label.toLowerCase().includes('generated') ||
          track.label.toLowerCase().includes('auto');

        if (targetLang !== 'off' && lang === targetLang && !activated && !isGenerated) {
          track.mode = 'showing';
          activated = true;
          if (['ar', 'ur', 'fa', 'he'].includes(lang)) {
            targetIsRtl = true;
          }
        } else {
          // Strictly disable all other tracks to prevent dual rendering
          track.mode = 'disabled';
        }
      }
    }

    // Set RTL direction attributes for browser cue alignment
    const container = document.querySelector('.media-container') || video.parentElement;
    if (container) {
      if (targetIsRtl) {
        container.setAttribute('data-caption-rtl', 'true');
        container.setAttribute('dir', 'rtl');
      } else {
        container.removeAttribute('data-caption-rtl');
        container.removeAttribute('dir');
      }
    }
  }, []);

  // Sync available text tracks from the media element and enforce exclusivity
  const syncTracks = useCallback(() => {
    const video = document.querySelector('video');
    if (!video || !video.textTracks) return;

    const items: TrackItem[] = [];
    const seenLangs = new Set<string>();

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (track.kind === 'subtitles' || track.kind === 'captions') {
        const lang = track.language || track.label.toLowerCase().slice(0, 2);
        const isGenerated =
          track.label.toLowerCase().includes('generated') ||
          track.label.toLowerCase().includes('auto');

        // Only present human-verified tracks in UI
        if (!isGenerated && !seenLangs.has(lang)) {
          seenLangs.add(lang);
          const isRtl = ['ar', 'ur', 'fa', 'he'].includes(lang);
          items.push({
            id: `${track.label}-${i}`,
            label: track.label || lang,
            language: lang,
            isRtl,
          });
        }
      }
    }

    setTracks(items);

    // Enforce exclusivity: if more than 1 track is currently showing, force target selection
    let showingCount = 0;
    let showingLang = 'off';

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if ((track.kind === 'subtitles' || track.kind === 'captions') && track.mode === 'showing') {
        showingCount++;
        if (showingLang === 'off') {
          showingLang = track.language || track.label.toLowerCase().slice(0, 2);
        }
      }
    }

    if (showingCount > 1 || (persistentSelectedLang !== 'off' && showingLang !== persistentSelectedLang)) {
      applyTrackSelection(persistentSelectedLang);
    } else if (showingCount === 1) {
      persistentSelectedLang = showingLang;
      setActiveLang(showingLang);
    } else {
      persistentSelectedLang = 'off';
      setActiveLang('off');
    }
  }, [applyTrackSelection]);

  useEffect(() => {
    syncTracks();
    const video = document.querySelector('video');
    if (video && video.textTracks) {
      video.textTracks.addEventListener('change', syncTracks);
      return () => video.textTracks.removeEventListener('change', syncTracks);
    }
  }, [syncTracks]);

  // Handle language selection click
  const selectLanguage = (lang: string) => {
    applyTrackSelection(lang);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
        e.stopPropagation();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasSubtitles = activeLang !== 'off';

  return (
    <div className={cn('fold-captions-menu-wrap', className)} ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className={cn('fold-screen-btn', 'fold-captions-trigger', hasSubtitles && 'is-active')}
        onClick={() => {
          syncTracks();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Subtitles menu. Current: ${activeLang === 'off' ? 'Off' : activeLang.toUpperCase()}`}
        title="Subtitles & Translation (c)"
      >
        <FoldCaptionsIcon className="fold-icon" />
        {hasSubtitles && <span className="fold-captions-badge">{activeLang.toUpperCase()}</span>}
      </button>

      {isOpen && (
        <div className="fold-captions-dropdown" role="menu" aria-label="Subtitle and caption tracks">
          <div className="fold-dropdown-header">
            <span className="fold-dropdown-title">SUBTITLES & TRANSLATION</span>
            <span className="fold-dropdown-sub">VERIFIED & SYNCHRONIZED</span>
          </div>

          <div className="fold-dropdown-list">
            {/* Off Option */}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={activeLang === 'off'}
              className={cn('fold-dropdown-item', activeLang === 'off' && 'is-checked')}
              onClick={() => selectLanguage('off')}
            >
              <span className="fold-radio-indicator" aria-hidden="true" />
              <span className="fold-item-label">Off</span>
            </button>

            {/* Available Tracks */}
            {tracks.map((track) => {
              const isSelected = activeLang === track.language;
              return (
                <button
                  key={track.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  className={cn(
                    'fold-dropdown-item',
                    isSelected && 'is-checked',
                    track.isRtl && 'is-rtl-lang'
                  )}
                  onClick={() => selectLanguage(track.language)}
                >
                  <span className="fold-radio-indicator" aria-hidden="true" />
                  <span className="fold-item-label">{track.label}</span>
                  {track.isRtl && <span className="fold-rtl-tag">RTL</span>}
                </button>
              );
            })}

            {tracks.length === 0 && (
              <div className="fold-dropdown-empty">No subtitle tracks found in media</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
