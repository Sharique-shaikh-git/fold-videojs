import { Slider as SliderPrimitive, TimeSlider as TimeSliderPrimitive } from '@videojs/react';
import type { ThumbnailSlot } from './shared/time-slider';
import { cn } from '@/lib/resolve-class-name';

// 5 clean major calibration divisions (0%, 25%, 50%, 75%, 100%) - reduces clutter and preserves cinema aesthetic
const CALIBRATION_MARKS = [
  { pos: 0, label: '0%' },
  { pos: 25, label: '25%' },
  { pos: 50, label: '50%' },
  { pos: 75, label: '75%' },
  { pos: 100, label: '100%' },
];

export function FoldRuler({ renderThumbnail, expanded = false }: ThumbnailSlot & { expanded?: boolean } = {}) {
  return (
    <div className={cn('fold-ruler-container', expanded && 'fold-ruler-expanded')}>
      <TimeSliderPrimitive.Root
        className={cn('fold-time-slider', 'media-time-slider')}
        thumbAlignment="edge"
      >
        {/* Chapters and Continuous Track */}
        <TimeSliderPrimitive.Chapters
          className="fold-slider-chapters media-time-slider-chapters"
          renderChapter={(props) => (
            <div className="fold-slider-chapter media-time-slider-chapter" {...props}>
              <TimeSliderPrimitive.Track className="fold-slider-track media-time-slider-track">
                {/* Buffered Region: Warm metallic pewter bar */}
                <TimeSliderPrimitive.Buffer className="fold-slider-buffer media-time-slider-buffer" />
                {/* Played Progress: Unmistakable bold vermilion progress track */}
                <TimeSliderPrimitive.Fill className="fold-slider-fill media-time-slider-fill" />
              </TimeSliderPrimitive.Track>
            </div>
          )}
        />

        {/* Tactile, Highly Visible Cinema Playhead */}
        <TimeSliderPrimitive.Thumb className="fold-slider-thumb media-time-slider-thumb">
          <div className="fold-playhead-badge" aria-hidden="true">
            <div className="fold-playhead-cap" />
            <div className="fold-playhead-center-dot" />
            <div className="fold-playhead-needle" />
          </div>
        </TimeSliderPrimitive.Thumb>

        {/* Hover / Scrub Target Time & Storyboard Frame Preview */}
        <TimeSliderPrimitive.Preview className="fold-slider-preview media-time-slider-preview">
          <SliderPrimitive.Thumbnail.Root className="fold-thumbnail-root media-slider-thumbnail">
            <SliderPrimitive.Thumbnail.Image
              render={renderThumbnail}
              className="fold-thumbnail-image media-slider-thumbnail-image"
            />
          </SliderPrimitive.Thumbnail.Root>

          <div className="fold-preview-meta media-time-slider-preview-meta">
            <div className="fold-preview-label media-time-slider-preview-label">
              <span className="fold-preview-cue" aria-hidden="true">TARGET</span>
              <TimeSliderPrimitive.Value className="fold-preview-time media-time-slider-value" type="pointer" />
              <TimeSliderPrimitive.ChapterTitle className="fold-preview-chapter media-time-slider-chapter-title" />
            </div>
          </div>
        </TimeSliderPrimitive.Preview>
      </TimeSliderPrimitive.Root>

      {/* Clean Bottom Calibration Rail (Etched below track so it never obscures progress) */}
      <div className="fold-calibration-rail" aria-hidden="true">
        {CALIBRATION_MARKS.map((m) => (
          <div
            key={m.label}
            className="fold-cal-mark"
            style={{ left: `${m.pos}%` }}
          >
            <span className="fold-cal-tick" />
            {expanded && <span className="fold-cal-label">{m.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
