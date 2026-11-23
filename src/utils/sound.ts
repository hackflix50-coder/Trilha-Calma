// Gentle, neurodivergent-friendly Web Audio API sound synthesizer.
// Uses soft sine waves and warm pentatonic intervals — never harsh buzzers.

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, delay = 0, volume = 0.08) {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playSoftSelect(enabled: boolean) {
  if (!enabled) return;
  playTone(523.25, 0.16, 0, 0.06); // C5
}

export function playSoftStep(enabled: boolean) {
  if (!enabled) return;
  playTone(440, 0.08, 0, 0.03); // A4 very gentle
}

export function playSoftGentleNudge(enabled: boolean) {
  if (!enabled) return;
  // Neutral low-volume muted marimba-like tap, never a harsh error buzz
  playTone(293.66, 0.12, 0, 0.035); // D4
}

export function playSoftSuccess(enabled: boolean) {
  if (!enabled) return;
  // Warm C major pentatonic arpeggio
  playTone(523.25, 0.22, 0, 0.07);     // C5
  playTone(659.25, 0.22, 0.09, 0.07);  // E5
  playTone(783.99, 0.34, 0.18, 0.08);  // G5
}
