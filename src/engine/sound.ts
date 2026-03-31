/**
 * Simple sound system using Web Audio API.
 * Generates procedural sound effects — no external files needed.
 */

import { isSoundEnabled } from './settings';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  _detune: number = 0
) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = _detune;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — fail silently
  }
}

export const SFX = {
  /** Card played from hand */
  cardPlay() {
    playTone(800, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(1000, 0.08, 'sine', 0.08), 50);
  },

  /** Summon placed on board */
  summonPlace() {
    playTone(300, 0.15, 'triangle', 0.12);
    setTimeout(() => playTone(500, 0.2, 'triangle', 0.1), 100);
    setTimeout(() => playTone(700, 0.25, 'triangle', 0.08), 200);
  },

  /** Attack hits */
  attackHit() {
    playTone(200, 0.12, 'sawtooth', 0.08);
    playTone(150, 0.15, 'square', 0.05);
  },

  /** Attack misses */
  attackMiss() {
    playTone(400, 0.15, 'sine', 0.06);
    setTimeout(() => playTone(300, 0.2, 'sine', 0.04), 80);
  },

  /** Critical hit */
  criticalHit() {
    playTone(400, 0.1, 'sawtooth', 0.1);
    setTimeout(() => playTone(600, 0.1, 'sawtooth', 0.1), 60);
    setTimeout(() => playTone(900, 0.15, 'sawtooth', 0.08), 120);
  },

  /** Summon defeated */
  defeat() {
    playTone(400, 0.2, 'sawtooth', 0.1);
    setTimeout(() => playTone(300, 0.25, 'sawtooth', 0.08), 100);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.06), 200);
    setTimeout(() => playTone(100, 0.4, 'sawtooth', 0.04), 300);
  },

  /** Healing effect */
  heal() {
    playTone(500, 0.15, 'sine', 0.08);
    setTimeout(() => playTone(700, 0.15, 'sine', 0.08), 100);
    setTimeout(() => playTone(900, 0.2, 'sine', 0.06), 200);
  },

  /** Level up */
  levelUp() {
    playTone(400, 0.1, 'triangle', 0.08);
    setTimeout(() => playTone(500, 0.1, 'triangle', 0.08), 80);
    setTimeout(() => playTone(600, 0.1, 'triangle', 0.08), 160);
    setTimeout(() => playTone(800, 0.15, 'triangle', 0.06), 240);
  },

  /** Victory Point gained */
  vpGain() {
    playTone(600, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(800, 0.1, 'sine', 0.1), 100);
    setTimeout(() => playTone(1000, 0.2, 'sine', 0.08), 200);
    setTimeout(() => playTone(1200, 0.25, 'sine', 0.06), 300);
  },

  /** Game victory */
  victory() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'triangle', 0.1), i * 200);
    });
  },

  /** Game defeat */
  gameDefeat() {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 'sawtooth', 0.06), i * 250);
    });
  },

  /** Button click */
  click() {
    playTone(1000, 0.05, 'sine', 0.05);
  },

  /** Counter triggered */
  counterTrigger() {
    playTone(800, 0.08, 'square', 0.08);
    setTimeout(() => playTone(1200, 0.1, 'square', 0.06), 60);
    setTimeout(() => playTone(600, 0.15, 'square', 0.04), 120);
  },

  /** Pack opening */
  packOpen() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(400 + i * 100, 0.1, 'triangle', 0.06), i * 60);
    }
  },

  /** Card reveal */
  cardReveal() {
    playTone(600 + Math.random() * 400, 0.1, 'sine', 0.08);
  },
};
