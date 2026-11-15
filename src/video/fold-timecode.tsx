import { useState } from 'react';
import { usePlayer } from '@videojs/react/video';

function formatSMPTE(seconds: number, fps = 24): { hours: string; minutes: string; secs: string; frames: string } {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return { hours: '00', minutes: '00', secs: '00', frames: '00' };
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);

  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    secs: String(s).padStart(2, '0'),
    frames: String(f).padStart(2, '0'),
  };
}

export function FoldTimecode({ fps = 24, className = '' }: { fps?: number; className?: string }) {
  const currentTime = usePlayer((s) => s.currentTime) ?? 0;
  const duration = usePlayer((s) => s.duration) ?? 0;
  const [showRemaining, setShowRemaining] = useState(false);

  const displayTime = showRemaining ? Math.max(0, duration - currentTime) : currentTime;
  const currentSMPTE = formatSMPTE(displayTime, fps);
  const durationSMPTE = formatSMPTE(duration, fps);

  const prefix = showRemaining ? '-' : '';

  return (
    <button
      type="button"
      className={`fold-timecode-btn ${className}`}
      onClick={() => setShowRemaining((prev) => !prev)}
      title="Click to toggle between elapsed and remaining time"
      aria-label={`Timecode: ${prefix}${currentSMPTE.minutes}:${currentSMPTE.secs}:${currentSMPTE.frames} of ${durationSMPTE.minutes}:${durationSMPTE.secs}:${durationSMPTE.frames}. Click to toggle remaining time.`}
    >
      <span className="fold-timecode-label">{showRemaining ? 'REM' : 'TC'}</span>
      <span className="fold-timecode-digits">
        {prefix}
        {duration >= 3600 && <span className="fold-time-h">{currentSMPTE.hours}:</span>}
        <span className="fold-time-m">{currentSMPTE.minutes}:</span>
        <span className="fold-time-s">{currentSMPTE.secs}</span>
        <span className="fold-time-delim">:</span>
        <span className="fold-time-f">{currentSMPTE.frames}</span>
      </span>
      <span className="fold-timecode-separator">/</span>
      <span className="fold-timecode-duration">
        {duration >= 3600 && <span className="fold-time-h">{durationSMPTE.hours}:</span>}
        <span className="fold-time-m">{durationSMPTE.minutes}:</span>
        <span className="fold-time-s">{durationSMPTE.secs}</span>
      </span>
    </button>
  );
}
