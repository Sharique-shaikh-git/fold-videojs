import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '@videojs/react/video';
import { cn } from '@/lib/resolve-class-name';

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00.00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function FoldCreativeTools({ className = '' }: { className?: string }) {
  const store = usePlayer();
  const currentTime = usePlayer((s) => s.currentTime) ?? 0;
  const duration = usePlayer((s) => s.duration) ?? 0;
  const paused = usePlayer((s) => s.paused) ?? true;

  // Frame Capture State
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Clipping Mode State
  const [isClipMode, setIsClipMode] = useState(false);
  const [inPoint, setInPoint] = useState<number>(0);
  const [outPoint, setOutPoint] = useState<number>(0);
  const [isPreviewingClip, setIsPreviewingClip] = useState(false);

  // ---------------------------------------------------------------------------
  // Frame Capture Functionality (Real HTML5 Video Canvas extraction)
  // ---------------------------------------------------------------------------
  const handleCaptureFrame = useCallback(() => {
    const video = document.querySelector('video');
    if (!video) {
      setCaptureStatus('error');
      return;
    }

    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setCaptureStatus('error');
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);

      // toBlob throws a SecurityError if canvas is tainted by CORS
      canvas.toBlob((blob) => {
        if (!blob) {
          setCaptureStatus('error');
          return;
        }
        setCaptureStatus('success');
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const timecodeStr = formatSeconds(video.currentTime).replace(/[:.]/g, '-');
        a.download = `fold_frame_${timecodeStr}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        setTimeout(() => setCaptureStatus('idle'), 3500);
      }, 'image/png');
    } catch (err) {
      console.warn('Frame capture restricted by security/CORS policy:', err);
      setCaptureStatus('error');
      setTimeout(() => setCaptureStatus('idle'), 4000);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Clip In / Out Logic & Dual-Handle Steppers
  // ---------------------------------------------------------------------------
  const handleSetIn = () => {
    const newIn = Math.min(currentTime, outPoint > 0 ? outPoint - 0.2 : duration);
    setInPoint(newIn);
    if (outPoint <= newIn) {
      setOutPoint(Math.min(duration, newIn + 5));
    }
  };

  const handleSetOut = () => {
    const newOut = Math.max(currentTime, inPoint + 0.2);
    setOutPoint(newOut);
  };

  const toggleClipPreview = () => {
    if (isPreviewingClip) {
      setIsPreviewingClip(false);
      store.pause();
    } else {
      setIsPreviewingClip(true);
      store.seek(inPoint);
      store.play();
    }
  };

  // Monitor loop while previewing clip range
  useEffect(() => {
    if (!isPreviewingClip) return;

    if (currentTime >= outPoint) {
      store.seek(inPoint);
    }
  }, [isPreviewingClip, currentTime, inPoint, outPoint, store]);

  // Stop preview if paused by user
  useEffect(() => {
    if (paused && isPreviewingClip) {
      setIsPreviewingClip(false);
    }
  }, [paused, isPreviewingClip]);

  // Export clip manifest / cue data (JSON / EDL metadata only, no false claims of video file export)
  const handleExportClipMetadata = () => {
    const clipData = {
      generator: 'FOLD Living Cinema Interface v10',
      exportedAt: new Date().toISOString(),
      cueType: 'IN_OUT_RANGE_CUE',
      clipRange: {
        inPointSeconds: inPoint,
        inPointTimecode: formatSeconds(inPoint),
        outPointSeconds: outPoint,
        outPointTimecode: formatSeconds(outPoint),
        durationSeconds: Math.max(0, outPoint - inPoint),
        durationFormatted: formatSeconds(Math.max(0, outPoint - inPoint)),
      },
    };

    const blob = new Blob([JSON.stringify(clipData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fold_cue_${formatSeconds(inPoint).replace(/[:.]/g, '-')}_to_${formatSeconds(outPoint).replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clipDuration = Math.max(0, outPoint - inPoint);

  return (
    <div className={cn('fold-creative-tools-wrap', className)}>
      <div className="fold-creative-actions">
        {/* Frame Capture Button */}
        <button
          type="button"
          className={cn('fold-tool-btn', 'fold-capture-btn', captureStatus === 'success' && 'is-captured')}
          onClick={handleCaptureFrame}
          title="Capture current high-resolution video frame (PNG)"
          aria-label="Capture video frame"
        >
          <svg viewBox="0 0 20 20" fill="none" className="fold-icon" aria-hidden="true">
            <path
              d="M3 6.5C3 5.4 3.9 4.5 5 4.5H7.2L8.5 3H11.5L12.8 4.5H15C16.1 4.5 17 5.4 17 6.5V14.5C17 15.6 16.1 16.5 15 16.5H5C3.9 16.5 3 15.6 3 14.5V6.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="fold-tool-sub">{captureStatus === 'success' ? 'SAVED' : 'SNAP'}</span>
        </button>

        {/* Clip Mode Toggle Button */}
        <button
          type="button"
          className={cn('fold-tool-btn', 'fold-clip-mode-btn', isClipMode && 'is-active')}
          onClick={() => {
            if (!isClipMode) {
              setInPoint(currentTime);
              setOutPoint(Math.min(duration, currentTime + 5));
            }
            setIsClipMode((prev) => !prev);
          }}
          title="Toggle Video Range Clipping Tool"
          aria-pressed={isClipMode}
          aria-label="Toggle Video Range Clipping Tool"
        >
          <svg viewBox="0 0 20 20" fill="none" className="fold-icon" aria-hidden="true">
            <path d="M4 4V16M16 4V16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 7L4 10L7 13M13 7L16 10L13 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="fold-tool-sub">CLIP</span>
        </button>
      </div>

      {/* Frame Capture Feedback Toast */}
      {captureStatus === 'error' && (
        <div className="fold-capture-feedback is-error" role="alert">
          Capture restricted by browser CORS security policy.
        </div>
      )}

      {/* Video Clipping Drawer / Panel */}
      {isClipMode && (
        <div className="fold-clip-drawer" role="region" aria-label="Video Range Trimmer and Cue Marks">
          <div className="fold-clip-header">
            <span className="fold-clip-title">CINEMA RANGE TRIMMER</span>
            <span className="fold-clip-duration">
              CLIP DURATION: <strong>{formatSeconds(clipDuration)}</strong>
            </span>
            <button
              type="button"
              className="fold-clip-close-btn"
              onClick={() => setIsClipMode(false)}
              aria-label="Close range trimmer (Esc)"
              title="Close range trimmer"
            >
              ✕
            </button>
          </div>

          {/* Interactive Dual Handles for Mouse, Touch, and Keyboard */}
          <div className="fold-clip-sliders-wrap">
            <div className="fold-clip-handle-group">
              <label htmlFor="fold-in-range" className="fold-point-label">
                IN POINT: <strong>{formatSeconds(inPoint)}</strong>
              </label>
              <div className="fold-handle-inputs">
                <button
                  type="button"
                  className="fold-nudge-btn"
                  onClick={() => setInPoint((p) => Math.max(0, Number((p - 0.5).toFixed(1))))}
                  aria-label="Nudge IN point backward 0.5s"
                  title="-0.5s"
                >
                  -0.5s
                </button>
                <input
                  id="fold-in-range"
                  type="range"
                  className="fold-clip-slider"
                  min={0}
                  max={Math.max(0, outPoint - 0.2)}
                  step={0.1}
                  value={inPoint}
                  onChange={(e) => setInPoint(parseFloat(e.target.value))}
                  aria-label="Clip start point in seconds"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(0, outPoint - 0.2)}
                  aria-valuenow={inPoint}
                  aria-valuetext={formatSeconds(inPoint)}
                />
                <button
                  type="button"
                  className="fold-nudge-btn"
                  onClick={() => setInPoint((p) => Math.min(outPoint - 0.2, Number((p + 0.5).toFixed(1))))}
                  aria-label="Nudge IN point forward 0.5s"
                  title="+0.5s"
                >
                  +0.5s
                </button>
                <button
                  type="button"
                  className="fold-mark-btn"
                  onClick={handleSetIn}
                  title="Mark current frame as IN point"
                >
                  MARK IN
                </button>
              </div>
            </div>

            <div className="fold-clip-handle-group">
              <label htmlFor="fold-out-range" className="fold-point-label">
                OUT POINT: <strong>{formatSeconds(outPoint)}</strong>
              </label>
              <div className="fold-handle-inputs">
                <button
                  type="button"
                  className="fold-nudge-btn"
                  onClick={() => setOutPoint((p) => Math.max(inPoint + 0.2, Number((p - 0.5).toFixed(1))))}
                  aria-label="Nudge OUT point backward 0.5s"
                  title="-0.5s"
                >
                  -0.5s
                </button>
                <input
                  id="fold-out-range"
                  type="range"
                  className="fold-clip-slider"
                  min={inPoint + 0.2}
                  max={duration || 100}
                  step={0.1}
                  value={outPoint}
                  onChange={(e) => setOutPoint(parseFloat(e.target.value))}
                  aria-label="Clip end point in seconds"
                  aria-valuemin={inPoint + 0.2}
                  aria-valuemax={duration || 100}
                  aria-valuenow={outPoint}
                  aria-valuetext={formatSeconds(outPoint)}
                />
                <button
                  type="button"
                  className="fold-nudge-btn"
                  onClick={() => setOutPoint((p) => Math.min(duration, Number((p + 0.5).toFixed(1))))}
                  aria-label="Nudge OUT point forward 0.5s"
                  title="+0.5s"
                >
                  +0.5s
                </button>
                <button
                  type="button"
                  className="fold-mark-btn"
                  onClick={handleSetOut}
                  title="Mark current frame as OUT point"
                >
                  MARK OUT
                </button>
              </div>
            </div>
          </div>

          <div className="fold-clip-actions-row">
            <button
              type="button"
              className={cn('fold-clip-preview-btn', isPreviewingClip && 'is-looping')}
              onClick={toggleClipPreview}
              aria-label={isPreviewingClip ? 'Halt loop preview' : 'Loop preview clip range'}
            >
              {isPreviewingClip ? 'HALT LOOP' : 'LOOP CLIP ▶'}
            </button>

            <button
              type="button"
              className="fold-clip-export-btn"
              onClick={handleExportClipMetadata}
              title="Export Range Cue Metadata (JSON format)"
              aria-label="Export clip range cue data as JSON"
            >
              EXPORT CUE (JSON)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
