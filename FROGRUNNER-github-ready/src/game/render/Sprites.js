/**
 * Sprite / image loading + draw helpers extracted from the original game.js.
 * No logic changes — only moved into this module.
 */
/**
 * LOGIC: createSprites({ ASSETS, ctx })
 * - Loads all images used by the runner (ground tile, frog sheet, coin sheet).
 * - Defines the exact source rectangles (sx/sy/sw/sh) for each frog frame.
 * - Returns helper functions so game.js can draw sprites without knowing
 *   the sprite-sheet math.
 */
export function createSprites({ ASSETS, ctx }) {
  // ---------- GROUND TILE (ground.png) ----------
  const groundImg = new Image();
  groundImg.src = ASSETS.groundPng;
  let groundReady = false;
  groundImg.onload = () => { groundReady = true; };
  groundImg.onerror = () => { console.error('Failed to load ground.png'); groundReady = false; };

  // Source tile size in the PNG (we cropped a 32x32 block)
  const GROUND_SRC = 32;
  // Draw size on canvas (keep pixel art crisp)
  const GROUND_DRAW = 64;

  // ---------- SPRITE SHEET (frog.png) ----------
  const frogSheet = new Image();
  frogSheet.src = ASSETS.frogPng;
  let frogReady = false;
  frogSheet.onload = () => { frogReady = true; };

  // Sprite sheet grid (frog.png)
  const TILE = 32;

  // Frames (source pixel coords in frog.png)
  const FROG_FRAMES = {
    idle: { sx: 0, sy: 0, sw: TILE, sh: TILE },
    run: Array.from({ length: 12 }, (_, i) => ({
      sx: i * TILE,
      sy: 32,
      sw: TILE,
      sh: TILE,
    })),
    jump:  { sx: 0, sy: 0, sw: TILE, sh: TILE },
  };
  /**
   * LOGIC: drawFrogFrame(frame, dx, dy, dw, dh, { flipX })
   * - Draws ONE frame of the frog sprite onto the canvas.
   * - If the sprite sheet is not loaded yet, draws a simple green placeholder box.
   * - If flipX is true, it mirrors the draw (useful if you ever face left).
   * - imageSmoothingEnabled=false keeps pixel art crisp.
   */


  function drawFrogFrame(frame, dx, dy, dw, dh, { flipX = false } = {}) {
    if (!frogReady) {
      ctx.fillStyle = "rgba(110, 255, 160, 0.9)";
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, 14);
      ctx.fill();
      return;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (flipX) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(
        frogSheet,
        frame.sx, frame.sy, frame.sw, frame.sh,
        0, 0, dw, dh
      );
    } else {
      ctx.drawImage(
        frogSheet,
        frame.sx, frame.sy, frame.sw, frame.sh,
        dx, dy, dw, dh
      );
    }

    ctx.restore();
  }

  // ---------- COIN SPRITESHEET (coins.png) ----------
  const coinImg = new Image();
  coinImg.src = ASSETS.coinsPng;
  let coinReady = false;
  coinImg.onload = () => { coinReady = true; };

  return {
    groundImg, groundReady: () => groundReady, GROUND_SRC, GROUND_DRAW,
    frogSheet, frogReady: () => frogReady, TILE, FROG_FRAMES, drawFrogFrame,
    coinImg, coinReady: () => coinReady,
  };
}
