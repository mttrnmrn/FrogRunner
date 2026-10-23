/**
 * LOGIC: ensureRoundRect()
 * - Some browsers don’t support ctx.roundRect().
 * - This function adds a compatible implementation to CanvasRenderingContext2D.prototype.
 * - The fallback builds a rounded rectangle path using arcTo() calls.
 * - Called once at init so the rest of the drawing code can safely use roundRect.
 */
export function ensureRoundRect() {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.arcTo(x, y + h, x, y, rr);
      this.arcTo(x, y, x + w, y, rr);
      this.closePath();
      return this;
    };
  }
}
