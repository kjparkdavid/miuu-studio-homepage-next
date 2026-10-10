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
// One track per stage (stages.js `music`), streamed, restarted at each race start and looping until
// the next one. It goes through the audio context so its level can be set: on iOS an <audio>
// element's own volume is fixed at full.
let song = null;   // { src, el } once a race has started on a stage that has music

function syncMusic() {
  if (!song) return;
  if (sfx.muted || document.hidden) song.el.pause();
  else song.el.play().catch(() => {});   // refused outside a tap: the next race start tries again
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && ac && ac.state !== "running") ac.resume().catch(() => {});
  syncMusic();
});

export const sfx = {
  muted: false,
  setMuted(on) { this.muted = on; syncMusic(); },
  // Start this stage's track from the top (call inside the tap that starts a race), or stop with null.
  music(track) {
    if (song && (!track || song.src !== track.src)) { song.el.pause(); song = null; }
    if (!track) return;
    if (!song) {
      const el = new Audio(track.src);
      el.loop = true;
      try {
        const gain = ac.createGain();
        gain.gain.value = track.vol;
        ac.createMediaElementSource(el).connect(gain).connect(ac.destination);
      } catch { el.volume = track.vol; }   // no Web Audio: plain element volume
      song = { src: track.src, el };
    }
    try { song.el.currentTime = 0; } catch {}
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
