// Sound: tiny synthesized effects (placeholders until real ones are supplied) and each stage's music.
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

// A burst of hiss through a low-pass filter: thumps and rumbles. `to` is where the filter slides to.
let hiss = null;
function noise(dur, { vol = 0.2, freq = 800, to = freq, delay = 0 } = {}) {
  if (!ac || sfx.muted) return;
  if (!hiss) {
    hiss = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = hiss.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + delay;
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = hiss; src.loop = true;
  f.type = "lowpass";
  f.frequency.setValueAtTime(freq, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}

// ---------------- background music ----------------
// Streamed tracks, one sounding at a time: the menu track on the title and result screens, the
// stage's own track (stages.js `music`) during a race. They go through the audio context so their
// level can be set and faded: on iOS an <audio> element's own volume is fixed at full.
const FADE = 0.4;            // seconds, when one track hands over to another
const songs = new Map();     // src -> { el, gain, vol }
let current = null;          // the one that should be sounding

function songFor(track) {
  let song = songs.get(track.src);
  if (!song) {
    const el = new Audio(track.src);
    el.loop = true;
    let gain = null;
    try {
      gain = ac.createGain();
      gain.gain.value = track.vol;
      ac.createMediaElementSource(el).connect(gain).connect(ac.destination);
    } catch { gain = null; el.volume = track.vol; }   // no Web Audio: plain element volume, no fades
    songs.set(track.src, (song = { el, gain, vol: track.vol }));
  }
  return song;
}
function fade(song, to) {
  if (!song.gain) return;
  const g = song.gain.gain, t = ac.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(to, t + FADE);
}
function syncMusic() {
  if (!current) return;
  if (sfx.muted || document.hidden) current.el.pause();
  else current.el.play().catch(() => {});   // refused before the first tap: the next tap tries again
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && ac && ac.state !== "running") ac.resume().catch(() => {});
  syncMusic();
});

export const sfx = {
  muted: false,
  setMuted(on) { this.muted = on; syncMusic(); },
  // Make `track` ({ src, vol }) the one that plays, or none with null. A track's first play has to
  // happen inside a tap or key press. `restart` plays it from the top instead of where it paused.
  music(track, { restart = false } = {}) {
    const next = track ? songFor(track) : null;
    if (current && current !== next) {
      const old = current;
      fade(old, 0);
      setTimeout(() => { if (current !== old) old.el.pause(); }, old.gain ? FADE * 1000 : 0);
    }
    current = next;
    if (!next) return;
    if (restart) { try { next.el.currentTime = 0; } catch {} }
    fade(next, next.vol);
    syncMusic();
  },
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
  // a bird sent flying: a thwack, a startled squawk, then a slide whistle as it sails off (a little
  // higher or lower each time, so a row of them doesn't sound like one)
  whack(n = 0) {
    const k = 1 + ((n * 5) % 7) * 0.035;
    noise(0.09, { vol: 0.3, freq: 2400, to: 300 });
    tone(170, 0.14, { type: "sine", vol: 0.22, slide: -110 });
    tone(1150 * k, 0.07, { type: "square", vol: 0.05, slide: 500, delay: 0.03 });
    tone(1500 * k, 0.09, { type: "square", vol: 0.045, slide: -600, delay: 0.1 });
    tone(520 * k, 0.5, { type: "sine", vol: 0.09, slide: 1500 * k, delay: 0.12 });
  },
  thunder() { noise(1.3, { vol: 0.16, freq: 420, to: 60, delay: 0.12 }); noise(0.25, { vol: 0.12, freq: 1800, to: 200, delay: 0.1 }); },
  tick() { tone(660, 0.12, { type: "triangle", vol: 0.15 }); },
  go() { tone(990, 0.3, { type: "triangle", vol: 0.18 }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.15, delay: i * 0.1 })); },
  lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.22, { type: "triangle", vol: 0.13, delay: i * 0.14 })); },
};
