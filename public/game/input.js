// Steering input: phone tilt (devicemotion gravity), touch, and keyboard.
// All sources produce steer in [-1, 1] (right positive) plus a "boost" trigger.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const RAD = 180 / Math.PI;

export const TILT = {
  deadZone: 2.5,   // degrees ignored around center
  fullLock: 26,    // degrees of rotation for full steer
};

export class Tilt {
  constructor() {
    this.g = null;          // low-passed gravity {x,y,z}
    this.conv = 1;          // +1 = spec/Android axis signs, -1 = inverted (older iOS)
    this.zero = 0;          // calibrated center angle (deg)
    this.events = 0;
    this.onMotion = this.onMotion.bind(this);
  }
  static supported() { return typeof window !== "undefined" && "DeviceMotionEvent" in window; }

  // Must be called synchronously from a tap handler (iOS permission rule).
  requestPermission() {
    const DME = window.DeviceMotionEvent;
    if (DME && typeof DME.requestPermission === "function") {
      return DME.requestPermission().then((r) => r === "granted").catch(() => false);
    }
    return Promise.resolve(Tilt.supported());
  }

  start() { window.addEventListener("devicemotion", this.onMotion); }
  stop() { window.removeEventListener("devicemotion", this.onMotion); }

  // Resolves true once real sensor data arrives (desktop browsers expose the API but send nulls).
  waitForData(ms = 1200) {
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = () => {
        if (this.events > 2) return res(true);
        if (performance.now() - t0 > ms) return res(false);
        setTimeout(tick, 50);
      };
      tick();
    });
  }

  onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null) return;
    const z = a.z ?? 0;
    if (!this.g) this.g = { x: a.x, y: a.y, z };
    const k = 0.35;
    this.g.x += (a.x - this.g.x) * k;
    this.g.y += (a.y - this.g.y) * k;
    this.g.z += (z - this.g.z) * k;
    this.events++;
  }

  // Roll angle relative to gravity: works whether the phone is held upright or flat.
  rawAngle() {
    if (!this.g) return 0;
    const { x, y, z } = this.g;
    const m = Math.hypot(x, y, z) || 1;
    return -this.conv * Math.asin(clamp(x / m, -1, 1)) * RAD;
  }

  calibrate() {
    if (!this.g) return;
    // Held in front of you, y+z points "up" in the spec convention; iOS has historically reported it negated.
    const s = this.g.y + this.g.z;
    if (Math.abs(s) > 2) this.conv = s > 0 ? 1 : -1;
    this.zero = this.rawAngle();
  }

  angle() { return this.rawAngle() - this.zero; }

  steer() {
    const a = this.angle();
    const m = Math.abs(a);
    if (m < TILT.deadZone) return 0;
    return Math.sign(a) * clamp((m - TILT.deadZone) / (TILT.fullLock - TILT.deadZone), 0, 1);
  }
}

export class TouchKeys {
  constructor(el, onBoost) {
    this.el = el;
    this.onBoost = onBoost;
    this.touches = new Map(); // id -> {x0, y0, x, y, t0}
    this.keys = new Set();
    this.lastTap = 0;
    this.keySteer = 0;
    el.addEventListener("touchstart", (e) => this.ts(e), { passive: false });
    el.addEventListener("touchmove", (e) => this.tm(e), { passive: false });
    el.addEventListener("touchend", (e) => this.te(e), { passive: false });
    el.addEventListener("touchcancel", (e) => this.te(e), { passive: false });
    el.addEventListener("dblclick", (e) => { e.preventDefault(); this.onBoost(); });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) this.onBoost(); }
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => { this.keys.clear(); this.touches.clear(); });
  }
  scale() { const r = this.el.getBoundingClientRect(); return { r, k: 540 / (r.width || 540) }; }
  ts(e) {
    e.preventDefault();
    const now = performance.now();
    for (const t of e.changedTouches) this.touches.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t0: now });
  }
  tm(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const o = this.touches.get(t.identifier);
      if (o) { o.x = t.clientX; o.y = t.clientY; }
    }
  }
  te(e) {
    e.preventDefault();
    const now = performance.now();
    for (const t of e.changedTouches) {
      const o = this.touches.get(t.identifier);
      this.touches.delete(t.identifier);
      if (!o) continue;
      const quick = now - o.t0 < 230 && Math.hypot(o.x - o.x0, o.y - o.y0) < 18;
      if (quick) {
        if (now - this.lastTap < 380) { this.lastTap = 0; this.onBoost(); }
        else this.lastTap = now;
      }
    }
  }
  // Touch: one finger drags sideways; two thumbs twist like the wheel in the reel.
  touchSteer() {
    const list = [...this.touches.values()];
    if (list.length >= 2) {
      const [a, b] = list[0].x < list[1].x ? [list[0], list[1]] : [list[1], list[0]];
      const ang0 = Math.atan2(b.y0 - a.y0, b.x0 - a.x0);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      return clamp(((ang - ang0) * RAD) / 35, -1, 1);
    }
    if (list.length === 1) {
      const { k } = this.scale();
      return clamp(((list[0].x - list[0].x0) * k) / 120, -1, 1);
    }
    return 0;
  }
  keyboardSteer(dt) {
    const l = this.keys.has("ArrowLeft") || this.keys.has("KeyA");
    const r = this.keys.has("ArrowRight") || this.keys.has("KeyD");
    const target = (r ? 1 : 0) - (l ? 1 : 0);
    const rate = target === 0 ? 7 : 4.5;
    this.keySteer += clamp(target - this.keySteer, -rate * dt, rate * dt);
    return this.keySteer;
  }
  touching() { return this.touches.size > 0; }
}
