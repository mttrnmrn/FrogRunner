/**
 * LOGIC: rand(min, max)
 * - Returns a random floating-point number in the range [min, max).
 * - Used for spawn sizes/positions so obstacles and trees vary a bit.
 */
export function rand(min, max) { return Math.random() * (max - min) + min; }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
