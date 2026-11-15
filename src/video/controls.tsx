/** @jsxImportSource react */

import { Controls } from '@videojs/react';
import type { ThumbnailSlot } from './shared/time-slider';
import { FoldDeck } from './fold-deck';
import { RetroDeck } from './retro/retro-deck';
import { MinimalDeck } from './minimal/minimal-deck';
import { RetroMusicPlayer } from './retro/retro-music-player';
import { useFoldTheme } from './theme-context';

export function VideoControls({ renderThumbnail }: ThumbnailSlot = {}) {
  const { theme, experience } = useFoldTheme();

  return (
    <Controls.Root>
      {experience === 'music' ? (
        <RetroMusicPlayer />
      ) : (
        <>
          {theme === 'cinema' && <FoldDeck renderThumbnail={renderThumbnail} />}
          {theme === 'retro' && <RetroDeck renderThumbnail={renderThumbnail} />}
          {theme === 'minimal' && <MinimalDeck renderThumbnail={renderThumbnail} />}
        </>
      )}
    </Controls.Root>
  );
}
