import { useEffect, useRef, useState } from 'react';

export type VisualizerPreset = 'spectrum' | 'oscilloscope' | 'liquid';

// Shared Web Audio pipeline singleton attached strictly to dedicated audio elements
let globalAudioCtx: AudioContext | null = null;
let globalAnalyser: AnalyserNode | null = null;
let globalSource: MediaElementAudioSourceNode | null = null;
let connectedAudioEl: HTMLMediaElement | null = null;

export function connectAudioElementToAnalyser(audioEl: HTMLMediaElement): AnalyserNode | null {
  try {
    if (!globalAudioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      globalAudioCtx = new AudioCtxClass();
    }

    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }

    if (!globalAnalyser) {
      globalAnalyser = globalAudioCtx.createAnalyser();
      globalAnalyser.fftSize = 128; // 64 frequency bins
      globalAnalyser.smoothingTimeConstant = 0.8;
    }

    if (connectedAudioEl !== audioEl) {
      try {
        globalSource = globalAudioCtx.createMediaElementSource(audioEl);
        globalSource.connect(globalAnalyser);
        globalAnalyser.connect(globalAudioCtx.destination);
        connectedAudioEl = audioEl;
      } catch (err) {
        // May already be connected or security policy
        console.warn('Audio source connection info:', err);
      }
    }

    return globalAnalyser;
  } catch (err) {
    console.warn('Web Audio API error:', err);
    return null;
  }
}

export function resumeAudioContext() {
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
}

interface RetroVisualizerProps {
  preset?: VisualizerPreset;
  onPresetChange?: (p: VisualizerPreset) => void;
  audioElementId?: string;
  isPlaying?: boolean;
  className?: string;
}

export function RetroVisualizer({
  preset = 'spectrum',
  onPresetChange,
  audioElementId = 'fold-retro-music-audio',
  isPlaying = false,
  className = '',
}: RetroVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [decibels, setDecibels] = useState<number>(-60);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let analyser: AnalyserNode | null = null;

    const audioEl = document.getElementById(audioElementId) as HTMLMediaElement | null;
    if (audioEl) {
      analyser = connectAudioElementToAnalyser(audioEl);
    }

    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const barCount = 28;
    const peakCaps = new Array(barCount).fill(0);
    const peakDecay = 0.9;
    let liquidPhase = 0;
    let liquidRot = 0;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      const width = canvas.clientWidth || 500;
      const height = canvas.clientHeight || 220;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Check audio status
      const hasRealAudio = audioEl && !audioEl.paused && isPlaying;

      if (analyser && hasRealAudio) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        let sum = 0;
        for (let i = 0; i < freqData.length; i++) sum += freqData[i];
        const avg = sum / freqData.length;
        const dB = avg > 0 ? Math.round(20 * Math.log10(avg / 255)) : -60;
        setDecibels(dB);
      } else {
        freqData.fill(0);
        timeData.fill(128); // 128 is center/flatline
        setDecibels(-60);
      }

      // Compute spectral bands for reactive visuals
      let bassSum = 0;
      for (let i = 0; i < 6; i++) bassSum += freqData[i];
      const bassAvg = bassSum / (6 * 255); // 0 to 1

      let midSum = 0;
      for (let i = 6; i < 24; i++) midSum += freqData[i];
      const midAvg = midSum / (18 * 255);

      let trebleSum = 0;
      for (let i = 24; i < Math.min(48, freqData.length); i++) trebleSum += freqData[i];
      const trebleAvg = trebleSum / (24 * 255);

      // Deep CRT background
      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      // Phosphor CRT scanlines
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 6; y < height; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // PRESET 1: CLASSIC SPECTRUM (Authentic Winamp / WMP Bars)
      // -------------------------------------------------------------
      if (preset === 'spectrum') {
        const gap = 3;
        const availableWidth = width - 24;
        const barWidth = Math.max(4, Math.floor((availableWidth - (barCount - 1) * gap) / barCount));
        const offsetX = Math.floor((width - (barCount * (barWidth + gap) - gap)) / 2);

        for (let i = 0; i < barCount; i++) {
          const dataIdx = Math.min(Math.floor((i / barCount) * freqData.length), freqData.length - 1);
          const rawVal = hasRealAudio ? freqData[dataIdx] / 255 : 0;
          const barHeight = Math.max(3, rawVal * (height - 24));
          const x = offsetX + i * (barWidth + gap);
          const y = height - 12 - barHeight;

          // Winamp phosphor gradient: Emerald -> Golden Amber -> Vermilion Red
          const grad = ctx.createLinearGradient(0, height - 12, 0, 12);
          grad.addColorStop(0, '#00e640');
          grad.addColorStop(0.65, '#ffd600');
          grad.addColorStop(0.88, '#f05b48');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak drop caps
          if (rawVal * (height - 24) > peakCaps[i]) {
            peakCaps[i] = rawVal * (height - 24);
          } else {
            peakCaps[i] = Math.max(0, peakCaps[i] - peakDecay);
          }

          if (peakCaps[i] > 2) {
            const capY = Math.max(12, height - 12 - peakCaps[i] - 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, capY, barWidth, 2);
          }
        }

        // Baseline rail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(offsetX, height - 11);
        ctx.lineTo(width - offsetX, height - 11);
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // PRESET 2: OSCILLOSCOPE (Phosphor Green Audio Waveform)
      // -------------------------------------------------------------
      else if (preset === 'oscilloscope') {
        // Center zero-crossing line
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, height / 2);
        ctx.lineTo(width - 10, height / 2);
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = hasRealAudio ? '#00ff66' : 'rgba(0, 230, 64, 0.4)';
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = hasRealAudio ? 8 : 2;
        ctx.beginPath();

        const sliceWidth = (width - 20) / bufferLength;
        let x = 10;

        for (let i = 0; i < bufferLength; i++) {
          let v = timeData[i] / 128.0; // 1.0 is center

          // If paused, produce a calm resting subtle hum
          if (!hasRealAudio) {
            const humPhase = liquidPhase * 0.5 + i * 0.1;
            v = 1.0 + Math.sin(humPhase) * 0.03;
          }

          const y = (v * (height - 20)) / 2 + 10;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Oscilloscope grid lines
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.08)';
        ctx.lineWidth = 1;
        for (let gx = 50; gx < width; gx += 60) {
          ctx.beginPath();
          ctx.moveTo(gx, 10);
          ctx.lineTo(gx, height - 10);
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // PRESET 3: LIQUID MEMORY (Generative Psychedelic Kaleidoscope)
      // -------------------------------------------------------------
      else if (preset === 'liquid') {
        const cx = width / 2;
        const cy = height / 2;

        if (!prefersReducedMotion) {
          liquidPhase += hasRealAudio ? 0.03 + bassAvg * 0.05 : 0.01;
          liquidRot += hasRealAudio ? 0.01 + midAvg * 0.03 : 0.003;
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(liquidRot);

        // Core radius driven by bass
        const baseRadius = Math.min(width, height) * 0.22;
        const pulse = hasRealAudio ? bassAvg * 45 : Math.sin(liquidPhase * 2) * 6;
        const coreRadius = Math.max(15, baseRadius + pulse);

        // Petal count driven by mid harmonics
        const petals = 8;
        const angleStep = (Math.PI * 2) / petals;

        // Outer iridescent glowing aura
        for (let p = 0; p < petals; p++) {
          const angle = p * angleStep;
          const petalReach = coreRadius * (1.2 + (hasRealAudio ? midAvg * 1.5 : 0.3));

          const px1 = Math.cos(angle + liquidPhase) * petalReach;
          const py1 = Math.sin(angle + liquidPhase) * petalReach;
          const px2 = Math.cos(angle - liquidPhase) * (petalReach * 0.6);
          const py2 = Math.sin(angle - liquidPhase) * (petalReach * 0.6);

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(px1, py1, px2, py2);
          ctx.closePath();

          // Palette: Vermilion -> Electric Cyan -> Violet
          const petalGrad = ctx.createRadialGradient(0, 0, 10, px1, py1, petalReach);
          petalGrad.addColorStop(0, 'rgba(240, 91, 72, 0.8)'); // vermilion
          petalGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.6)'); // cyan
          petalGrad.addColorStop(1, 'rgba(124, 77, 255, 0.1)'); // violet

          ctx.fillStyle = petalGrad;
          ctx.fill();
        }

        // Central pulsating ring
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = hasRealAudio ? '#00e5ff' : 'rgba(0, 229, 255, 0.4)';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = hasRealAudio ? 12 : 4;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        // Shimmering treble particle sparks
        if (hasRealAudio && trebleAvg > 0.1 && !prefersReducedMotion) {
          const sparkCount = Math.floor(trebleAvg * 20);
          ctx.fillStyle = '#ffffff';
          for (let s = 0; s < sparkCount; s++) {
            const sparkAngle = (s * 37) + liquidPhase * 4;
            const sparkDist = coreRadius * (0.8 + (s % 5) * 0.25);
            const sx = Math.cos(sparkAngle) * sparkDist;
            const sy = Math.sin(sparkAngle) * sparkDist;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      liquidPhase += 0.02;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [preset, audioElementId, isPlaying]);

  return (
    <div
      className={`fold-retro-vis-container ${className}`}
      role="region"
      aria-label="Windows Media Player Visualizer"
    >
      <div className="fold-vis-header">
        <div className="fold-vis-title-group">
          <span className="fold-vis-led-dot" aria-hidden="true" />
          <span className="fold-vis-title">
            {preset === 'spectrum' && 'CLASSIC SPECTRUM'}
            {preset === 'oscilloscope' && 'OSCILLOSCOPE CRT'}
            {preset === 'liquid' && 'LIQUID MEMORY'}
          </span>
          <span className="fold-vis-status">{isPlaying ? 'LIVE FFT' : 'STANDBY'}</span>
        </div>

        <div className="fold-vis-tools">
          <span className="fold-vis-db">{decibels} dB</span>
          <div className="fold-vis-preset-pills" role="group" aria-label="Visualizer Presets">
            <button
              type="button"
              className={`fold-vis-mode-btn ${preset === 'spectrum' ? 'is-active' : ''}`}
              onClick={() => onPresetChange?.('spectrum')}
              title="Classic Spectrum Analyzer"
              aria-pressed={preset === 'spectrum'}
            >
              SPECTRUM
            </button>
            <button
              type="button"
              className={`fold-vis-mode-btn ${preset === 'oscilloscope' ? 'is-active' : ''}`}
              onClick={() => onPresetChange?.('oscilloscope')}
              title="Phosphor Oscilloscope"
              aria-pressed={preset === 'oscilloscope'}
            >
              OSCILLOSCOPE
            </button>
            <button
              type="button"
              className={`fold-vis-mode-btn ${preset === 'liquid' ? 'is-active' : ''}`}
              onClick={() => onPresetChange?.('liquid')}
              title="Liquid Memory Psychedelic Visualizer"
              aria-pressed={preset === 'liquid'}
            >
              LIQUID
            </button>
          </div>
        </div>
      </div>

      <div className="fold-vis-canvas-wrap">
        <canvas ref={canvasRef} className="fold-vis-canvas" width={500} height={220} />
      </div>
    </div>
  );
}
