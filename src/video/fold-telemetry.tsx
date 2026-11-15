import { useState, useEffect } from 'react';
import { usePlayer } from '@videojs/react/video';

export function FoldTelemetry({ className = '' }: { className?: string }) {
  const duration = usePlayer((s) => s.duration) ?? 0;
  const [resolution, setResolution] = useState<{ width: number; height: number; aspect: string } | null>(null);

  useEffect(() => {
    const updateResolution = () => {
      const video = document.querySelector('video');
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        const ratio = (w / h).toFixed(2);
        const aspectLabel = Math.abs(w / h - 16 / 9) < 0.05 ? '16:9 DCI' : `${ratio}:1`;
        setResolution({ width: w, height: h, aspect: aspectLabel });
      }
    };

    updateResolution();
    const video = document.querySelector('video');
    if (video) {
      video.addEventListener('loadedmetadata', updateResolution);
      video.addEventListener('resize', updateResolution);
      return () => {
        video.removeEventListener('loadedmetadata', updateResolution);
        video.removeEventListener('resize', updateResolution);
      };
    }
  }, []);

  return (
    <div className={`fold-telemetry-strip ${className}`} aria-label="Technical Stream Telemetry">
      <span className="fold-telemetry-item">
        <span className="fold-telemetry-key">STREAM:</span>
        <span className="fold-telemetry-val">
          {resolution ? `${resolution.width}×${resolution.height}` : 'HD / HLS'}
        </span>
      </span>
      <span className="fold-telemetry-sep">/</span>
      <span className="fold-telemetry-item">
        <span className="fold-telemetry-key">ASPECT:</span>
        <span className="fold-telemetry-val">{resolution ? resolution.aspect : '16:9'}</span>
      </span>
      <span className="fold-telemetry-sep">/</span>
      <span className="fold-telemetry-item">
        <span className="fold-telemetry-key">TIMEBASE:</span>
        <span className="fold-telemetry-val">SMPTE 24-DROP</span>
      </span>
      <span className="fold-telemetry-sep">/</span>
      <span className="fold-telemetry-item">
        <span className="fold-telemetry-key">BUS:</span>
        <span className="fold-telemetry-val">STEREO 48kHz</span>
      </span>
    </div>
  );
}
