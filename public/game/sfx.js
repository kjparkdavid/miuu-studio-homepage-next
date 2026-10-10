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
  tick() { tone(660, 0.12, { type: "triangle", vol: 0.15 }); },
  go() { tone(990, 0.3, { type: "triangle", vol: 0.18 }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: "triangle", vol: 0.15, delay: i * 0.1 })); },
  lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.22, { type: "triangle", vol: 0.13, delay: i * 0.14 })); },
};
