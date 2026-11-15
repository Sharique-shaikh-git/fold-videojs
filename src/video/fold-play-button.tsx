import { PlayButton as PlayButtonPrimitive } from '@videojs/react';
import { FoldPlayIcon, FoldPauseIcon, FoldRestartIcon } from './fold-icons';
import { cn } from '@/lib/resolve-class-name';

export function FoldPlayButton({
  className = '',
  size = 'normal',
  showLabel = false,
}: {
  className?: string;
  size?: 'normal' | 'large' | 'compact';
  showLabel?: boolean;
}) {
  return (
    <PlayButtonPrimitive
      className={(state) =>
        cn(
          'fold-play-btn',
          `fold-play-${size}`,
          state.paused ? 'is-paused' : 'is-playing',
          state.ended && 'is-ended',
          className
        )
      }
      render={(props, state) => (
        <button
          type="button"
          {...props}
          aria-label={state.ended ? 'Replay video' : state.paused ? 'Play video' : 'Pause video'}
        >
          <span className="fold-play-icon-box" aria-hidden="true">
            {state.ended ? (
              <FoldRestartIcon className="fold-icon" />
            ) : state.paused ? (
              <FoldPlayIcon className="fold-icon fold-icon-play" />
            ) : (
              <FoldPauseIcon className="fold-icon fold-icon-pause" />
            )}
          </span>
          {showLabel && (
            <span className="fold-play-label" aria-hidden="true">
              {state.ended ? 'REPLAY' : state.paused ? 'PLAY' : 'PAUSE'}
            </span>
          )}
        </button>
      )}
    />
  );
}
