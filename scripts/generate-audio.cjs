const fs = require('fs');
const path = require('path');

// Generate 30 seconds of 44.1kHz 16-bit stereo ambient synth audio
const sampleRate = 44100;
const durationSec = 30;
const numChannels = 2;
const numSamples = sampleRate * durationSec;
const bytesPerSample = 2; // 16-bit
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;

const buffer = Buffer.alloc(44 + dataSize);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);

// fmt chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34); // bits per sample

// data chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Generate musical ambient pad chords (D minor / F / C / G progression with shimmer)
// Chords: Dm (D3: 146.8, F3: 174.6, A3: 220), F (F3, A3, C4: 261.6), C (C3: 130.8, E3: 164.8, G3: 196), G (G2: 98, B2: 123.5, D3)
const chords = [
  [146.83, 174.61, 220.00, 440.0, 880.0], // Dm
  [174.61, 220.00, 261.63, 523.25, 1046.5], // F
  [130.81, 164.81, 196.00, 392.0, 784.0], // C
  [98.00, 123.47, 146.83, 293.66, 587.33], // G
];

let offset = 44;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const chordIdx = Math.floor((t / 7.5) % chords.length);
  const chord = chords[chordIdx];

  // Synthesize chord tones with subtle LFO vibrato
  let leftSample = 0;
  let rightSample = 0;

  // Sub bass (low end punch)
  const bassFreq = chord[0] / 2;
  const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.35;
  leftSample += bass;
  rightSample += bass;

  // Mid harmonics
  for (let c = 0; c < chord.length; c++) {
    const f = chord[c];
    const detuneL = 1 + 0.002 * Math.sin(2 * Math.PI * 0.4 * t + c);
    const detuneR = 1 + 0.002 * Math.cos(2 * Math.PI * 0.35 * t + c);
    const amp = 0.15 / (c + 1);

    leftSample += Math.sin(2 * Math.PI * f * detuneL * t) * amp;
    rightSample += Math.sin(2 * Math.PI * f * detuneR * t) * amp;
  }

  // High shimmer (frequency > 2kHz for high spectrum bars)
  const shimmer = Math.sin(2 * Math.PI * 2200 * t) * 0.04 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t));
  leftSample += shimmer;
  rightSample += shimmer * 0.8;

  // Master envelope (fade in and fade out)
  const fadeIn = Math.min(1, t / 1.5);
  const fadeOut = Math.min(1, (durationSec - t) / 1.5);
  const env = fadeIn * fadeOut;

  // Clamp and convert to 16-bit integer
  const lInt = Math.max(-32767, Math.min(32767, Math.floor(leftSample * env * 32767 * 0.7)));
  const rInt = Math.max(-32767, Math.min(32767, Math.floor(rightSample * env * 32767 * 0.7)));

  buffer.writeInt16LE(lInt, offset);
  buffer.writeInt16LE(rInt, offset + 2);
  offset += 4;
}

const outPath = path.join('D:/project/videojs/fold/apps/preview/public', 'cosmic-ambience.wav');
fs.writeFileSync(outPath, buffer);
console.log('Generated authentic 30s stereo ambient audio file:', outPath, `(${buffer.length} bytes)`);
