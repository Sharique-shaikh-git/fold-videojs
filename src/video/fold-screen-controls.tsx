import {
  FullscreenButton as FullscreenButtonPrimitive,
  PiPButton as PiPButtonPrimitive,
  CaptionsButton as CaptionsButtonPrimitive,
} from '@videojs/react';
import {
  FoldFullscreenEnterIcon,
  FoldFullscreenExitIcon,
  FoldPipEnterIcon,
  FoldPipExitIcon,
  FoldCaptionsIcon,
} from './fold-icons';

export function FoldFullscreenButton({ className = '' }: { className?: string }) {
  return (
    <FullscreenButtonPrimitive
      className={`fold-screen-btn fold-fullscreen-btn ${className}`}
      render={(props, state) => (
        <button
          type="button"
          {...props}
          title={state.fullscreen ? 'Exit Fullscreen (f)' : 'Enter Fullscreen (f)'}
          aria-label={state.fullscreen ? 'Exit cinema fullscreen' : 'Enter cinema fullscreen'}
        >
          {state.fullscreen ? (
            <FoldFullscreenExitIcon className="fold-icon" />
          ) : (
            <FoldFullscreenEnterIcon className="fold-icon" />
          )}
        </button>
      )}
    />
  );
}

export function FoldPipButton({ className = '' }: { className?: string }) {
  return (
    <PiPButtonPrimitive
      className={`fold-screen-btn fold-pip-btn ${className}`}
      render={(props, state) => (
        <button
          type="button"
          {...props}
          title={state.pip ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
          aria-label={state.pip ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
        >
          {state.pip ? (
            <FoldPipExitIcon className="fold-icon" />
          ) : (
            <FoldPipEnterIcon className="fold-icon" />
          )}
        </button>
      )}
    />
  );
}

export function FoldCaptionsButton({ className = '' }: { className?: string }) {
  return (
    <CaptionsButtonPrimitive
      className={`fold-screen-btn fold-captions-btn ${className}`}
      render={(props, state) => (
        <button
          type="button"
          {...props}
          title={state.subtitlesShowing ? 'Subtitles On (c)' : 'Subtitles Off (c)'}
          aria-label={state.subtitlesShowing ? 'Disable subtitles' : 'Enable subtitles'}
          aria-pressed={state.subtitlesShowing}
        >
          <FoldCaptionsIcon className="fold-icon" />
        </button>
      )}
    />
  );
}
