import React, { createContext, useContext, useState, useEffect } from 'react';

export type FoldTheme = 'cinema' | 'retro' | 'minimal';
export type FoldExperience = 'video' | 'music';
export type MediaMode = 'video' | 'audio';

interface ThemeContextType {
  theme: FoldTheme;
  setTheme: (t: FoldTheme) => void;
  experience: FoldExperience;
  setExperience: (exp: FoldExperience) => void;
  mediaMode: MediaMode;
  setMediaMode: (m: MediaMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'cinema',
  setTheme: () => {},
  experience: 'video',
  setExperience: () => {},
  mediaMode: 'video',
  setMediaMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<FoldTheme>('cinema');
  const [experience, setExperienceState] = useState<FoldExperience>('video');
  const [mediaMode, setMediaMode] = useState<MediaMode>('video');

  const setExperience = (exp: FoldExperience) => {
    if (exp === 'music') {
      // Pause video immediately when switching to Music mode
      const video = document.querySelector('video');
      if (video && !video.paused) {
        video.pause();
      }
      setMediaMode('audio');
    } else {
      // Pause music immediately when returning to Video mode
      const audio = document.getElementById('fold-retro-music-audio') as HTMLAudioElement | null;
      if (audio && !audio.paused) {
        audio.pause();
      }
      setMediaMode('video');
    }
    setExperienceState(exp);
  };

  // Sync theme and experience attributes to container
  useEffect(() => {
    const container = document.querySelector('.media-container') || document.documentElement;
    container.setAttribute('data-fold-theme', theme);
    container.setAttribute('data-fold-experience', experience);
  }, [theme, experience]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        experience,
        setExperience,
        mediaMode,
        setMediaMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useFoldTheme() {
  return useContext(ThemeContext);
}
