import { clamp } from './math.js';

/**
 * LOGIC: aabb(a, b)
 * - Axis-Aligned Bounding Box collision.
 * - Treats a and b as rectangles: {x,y,w,h}
 * - Returns true if the rectangles overlap.
 */
export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * LOGIC: circleRectCollision(c, r)
 * - Checks if a circle touches a rectangle.
 * - Steps:
 *   1) Find the closest point on the rectangle to the circle center (clamp).
 *   2) Compute distance from circle center to that closest point.
 *   3) If distance <= radius, they collide.
 * - Used for coin pickup (circle) against player hitbox (rect).
 */
export function circleRectCollision(c, r) {
  const closestX = clamp(c.x, r.x, r.x + r.w);
  const closestY = clamp(c.y, r.y, r.y + r.h);
  const dx = c.x - closestX;
  const dy = c.y - closestY;
  return dx * dx + dy * dy <= c.r * c.r;
}
