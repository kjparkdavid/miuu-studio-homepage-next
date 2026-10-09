// Tiny synthesized sound effects (placeholder until real audio is supplied).
let ac = null;

function tone(freq, dur, { type = "sine", vol = 0.18, slide = 0, delay = 0 } = {}) {
  if (!ac || sfx.muted) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

export const sfx = {
  muted: false,
  unlock() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
    } catch { ac = null; }
  },
  pickup(n) { tone(880 + (n % 8) * 60, 0.09, { type: "triangle", vol: 0.12 }); },
  ready() { [660, 880, 1100].forEach((f, i) => tone(f, 0.1, { type: "triangle", vol: 0.12, delay: i * 0.07 })); },
  boost() { tone(220, 0.5, { type: "sawtooth", vol: 0.08, slide: 600 }); tone(440, 0.35, { type: "triangle", vol: 0.1, slide: 500 }); },
  bump() { tone(140, 0.25, { type: "square", vol: 0.12, slide: -90 }); },
  tick() { tone(660, 0.12, { type: "triangle", vol: 0.15 }); },
  go() { tone(990, 0.3, { type: "triangle", vol: 0.18 }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.15, delay: i * 0.1 })); },
  lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.22, { type: "triangle", vol: 0.13, delay: i * 0.14 })); },
};
