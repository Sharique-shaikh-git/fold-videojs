import { usePlayer } from '@videojs/react/video';

const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 2.0];

export function FoldSpeedSelector({ className = '' }: { className?: string }) {
  const store = usePlayer();
  const currentSpeed = usePlayer((s) => s.playbackRate) ?? 1.0;

  return (
    <div className={`fold-speed-pod ${className}`} role="group" aria-label="Playback speed calibration">
      <span className="fold-speed-pod-label" aria-hidden="true">
        SPEED
      </span>
      <div className="fold-speed-chips">
        {SPEED_PRESETS.map((rate) => {
          const isActive = Math.abs(currentSpeed - rate) < 0.05;
          return (
            <button
              key={rate}
              type="button"
              className={`fold-speed-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => store.setPlaybackRate(rate)}
              aria-pressed={isActive}
              aria-label={`${rate} times playback speed`}
            >
              {rate === 1.0 ? '1.0×' : `${rate}×`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
