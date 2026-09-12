/**
 * Osu-like timing windows for the pretotype playfield.
 * Speed ramps with combo: higher combo → smaller windows → move faster.
 */

const BASE_PERFECT = 48;
const BASE_GREAT = 96;
const BASE_OK = 300;

export function speedForCombo(combo) {
  return 1 + Math.floor(Math.max(0, combo) / 8) * 0.2;
}

export function hitWindows(speed) {
  const s = Math.max(1, speed);
  const scale = Math.pow(0.86, s - 1);
  return {
    perfect: Math.max(18, Math.round(BASE_PERFECT * scale)),
    great: Math.max(32, Math.round(BASE_GREAT * scale)),
    ok: Math.max(52, Math.round(BASE_OK * scale)),
  };
}

export function approachMs(speed) {
  return Math.max(280, Math.round(900 / Math.max(1, speed)));
}

export function judge(deltaMs, speed) {
  const abs = Math.abs(deltaMs);
  const w = hitWindows(speed);
  if (abs <= w.perfect) return "perfect";
  if (abs <= w.great) return "great";
  if (abs <= w.ok) return "ok";
  return "miss";
}

export function scoreFor(verdict) {
  if (verdict === "perfect") return 300;
  if (verdict === "great") return 100;
  if (verdict === "ok") return 50;
  return 0;
}

export function comboAfter(combo, verdict) {
  return verdict === "miss" ? 0 : combo + 1;
}

export function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function spinDelta(prev, next, center) {
  const a0 = Math.atan2(prev.y - center.y, prev.x - center.x);
  const a1 = Math.atan2(next.y - center.y, next.x - center.x);
  let d = a1 - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function accuracyFrom(counts) {
  const total = counts.perfect + counts.great + counts.ok + counts.miss;
  if (total === 0) return 100;
  const weighted = counts.perfect * 300 + counts.great * 100 + counts.ok * 50;
  return (100 * weighted) / (total * 300);
}
