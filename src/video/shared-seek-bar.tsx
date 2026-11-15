import { Slider as SliderPrimitive, TimeSlider as TimeSliderPrimitive } from '@videojs/react';
import { cn } from '@/lib/resolve-class-name';
import type { ThumbnailSlot } from './shared/time-slider';

export interface SharedSeekBarProps extends ThumbnailSlot {
  variant?: 'cinema' | 'retro' | 'minimal';
  expanded?: boolean;
  className?: string;
  showCalibration?: boolean;
}

export function SharedSeekBar({
  variant = 'cinema',
  expanded = false,
  className = '',
  showCalibration = true,
  renderThumbnail,
}: SharedSeekBarProps) {
  return (
    <div
      className={cn(
        'fold-shared-seek-wrap',
        `is-${variant}`,
        expanded && 'is-expanded',
        className
      )}
    >
      <TimeSliderPrimitive.Root
        className={cn(
          'fold-shared-slider',
          `is-${variant}`,
          expanded && 'is-expanded',
          'media-time-slider'
        )}
        thumbAlignment="edge"
      >
        {/* Continuous Horizontal Track */}
        <TimeSliderPrimitive.Track className="fold-seek-track media-time-slider-track">
          {/* Buffered Region */}
          <TimeSliderPrimitive.Buffer className="fold-seek-buffer media-time-slider-buffer" />
          {/* Played Progress (Fills smoothly left-to-right) */}
          <TimeSliderPrimitive.Fill className="fold-seek-fill media-time-slider-fill" />
        </TimeSliderPrimitive.Track>

        {/* Draggable Tactile Playhead Thumb */}
        <TimeSliderPrimitive.Thumb className="fold-seek-thumb media-time-slider-thumb">
          {variant === 'cinema' && (
            <div className="fold-cinema-playhead" aria-hidden="true">
              <div className="fold-cinema-cap" />
              <div className="fold-cinema-dot" />
              <div className="fold-cinema-needle" />
            </div>
          )}
          {variant === 'retro' && (
            <div className="fold-retro-handle" aria-hidden="true" />
          )}
          {variant === 'minimal' && (
            <div className="fold-min-handle" aria-hidden="true" />
          )}
        </TimeSliderPrimitive.Thumb>

        {/* Hover & Drag Target Time Preview */}
        <TimeSliderPrimitive.Preview className="fold-seek-preview media-time-slider-preview">
          {renderThumbnail && (
            <SliderPrimitive.Thumbnail.Root className="fold-seek-thumbnail-root media-slider-thumbnail">
              <SliderPrimitive.Thumbnail.Image
                render={renderThumbnail}
                className="fold-seek-thumbnail-img media-slider-thumbnail-image"
              />
            </SliderPrimitive.Thumbnail.Root>
          )}
          <div className="fold-seek-preview-badge media-time-slider-preview-label">
            <span className="fold-seek-cue-tag" aria-hidden="true">
              TARGET
            </span>
            <TimeSliderPrimitive.Value
              className="fold-seek-preview-time media-time-slider-value"
              type="pointer"
            />
          </div>
        </TimeSliderPrimitive.Preview>
      </TimeSliderPrimitive.Root>

      {/* Decorative calibration rail: for Cinema mode only, placed below with pointer-events: none */}
      {variant === 'cinema' && showCalibration && (
        <div className="fold-shared-calibration" aria-hidden="true">
          <div className="fold-cal-mark" style={{ left: '0%' }}>
            <span className="fold-cal-tick" />
            {expanded && <span className="fold-cal-label">0%</span>}
          </div>
          <div className="fold-cal-mark" style={{ left: '25%' }}>
            <span className="fold-cal-tick" />
            {expanded && <span className="fold-cal-label">25%</span>}
          </div>
          <div className="fold-cal-mark" style={{ left: '50%' }}>
            <span className="fold-cal-tick" />
            {expanded && <span className="fold-cal-label">50%</span>}
          </div>
          <div className="fold-cal-mark" style={{ left: '75%' }}>
            <span className="fold-cal-tick" />
            {expanded && <span className="fold-cal-label">75%</span>}
          </div>
          <div className="fold-cal-mark" style={{ left: '100%' }}>
            <span className="fold-cal-tick" />
            {expanded && <span className="fold-cal-label">100%</span>}
          </div>
        </div>
      )}
    </div>
  );
}
