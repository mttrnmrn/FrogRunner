import { rand } from '../utils/math.js';

/**
 * Pixel forest background (PARALLAX)
 * This is the exact background logic from your original game.js, moved into its own file.
 * No visual/design changes — only organized into a module.
 */
/**
 * LOGIC: createParallaxForest({ ctx, W, H })
 * - Builds the background “world” once (random tree positions + fog blobs).
 * - Returns a draw() function that renders the background every frame.
 * - Background scroll amount comes from state.parallax.* (set in game.js).
 */
export function createParallaxForest({ ctx, W, H }) {
  const forest = {
    far: makeTreeLine(26, 0.48, 0.70),
    mid: makeTreeLine(20, 0.58, 0.85),
    near: makeTreeLine(14, 0.68, 1.00),
    fog: makeFogBlobs(18),
  };

  
  /**
   * LOGIC: makeTreeLine(count, yMinRatio, yMaxRatio)
   * - Creates an array of tree “templates”.
   * - Each tree gets:
   *   * x position (spread across width)
   *   * base y position (somewhere between yMinRatio and yMaxRatio of screen)
   *   * random width/height
   *   * trunk width + canopy height derived from w/h
   * - This runs once so the forest layout stays consistent across frames.
   */
function makeTreeLine(count, yMinRatio, yMaxRatio) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const baseY = Math.floor(H * rand(yMinRatio, yMaxRatio));
      const h = Math.floor(rand(70, 150));
      const w = Math.floor(rand(40, 90));
      arr.push({
        x: (i / count) * W,
        y: baseY,
        w,
        h,
        trunkW: Math.floor(w * rand(0.18, 0.28)),
        canopyH: Math.floor(h * rand(0.55, 0.70)),
      });
    }
    return arr;
  }

  
  /**
   * LOGIC: makeFogBlobs(count)
   * - Creates circular fog blobs with random radius and alpha.
   * - Fog is later drawn twice (x and x+W) so it wraps smoothly while scrolling.
   */
function makeFogBlobs(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (i * 97) % W,
        y: Math.floor(H * rand(0.52, 0.82)),
        r: Math.floor(rand(80, 170)),
        a: rand(0.06, 0.12),
      });
    }
    return arr;
  }

  
  /**
   * LOGIC: drawFogBlob(x, y, r, a)
   * - Draws a single semi-transparent circle used as fog.
   * - Uses ctx.globalAlpha = a to control softness.
   */
function drawFogBlob(x, y, r, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  
  /**
   * LOGIC: drawTree(...)
   * - Draws one tree as:
   *   1) A vertical trunk rectangle
   *   2) A canopy made of a few stacked triangles (pixel-style pine tree)
   * - The triangle “layers” shrink as they go up to create the pine shape.
   */
function drawTree(x, baseY, w, h, trunkW, canopyH, trunkFill, leafFill) {
    const trunkX = Math.round(x + (w - trunkW) / 2);
    const trunkY = Math.round(baseY - h * 0.35);
    const trunkH = Math.round(h * 0.35);

    // trunk
    ctx.fillStyle = trunkFill;
    ctx.fillRect(trunkX, trunkY, trunkW, trunkH);

    // canopy (stacked triangles for pixel feel)
    ctx.fillStyle = leafFill;
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const layerW = Math.round(w * (1 - i * 0.18));
      const layerH = Math.round(canopyH * (1 - i * 0.18));
      const lx = Math.round(x + (w - layerW) / 2);
      const ly = Math.round(trunkY - layerH + i * 10);

      ctx.beginPath();
      ctx.moveTo(lx, ly + layerH);
      ctx.lineTo(lx + layerW / 2, ly);
      ctx.lineTo(lx + layerW, ly + layerH);
      ctx.closePath();
      ctx.fill();
    }
  }

  
  /**
   * LOGIC: drawTreeLayer(trees, offset, trunkFill, leafFill)
   * - Draws every tree in a layer with a horizontal offset (parallax).
   * - Also draws a duplicate at x + W so the layer wraps seamlessly.
   */
function drawTreeLayer(trees, offset, trunkFill, leafFill, state) {
    const ox = offset;
    for (const t of trees) {
      const x = t.x - ox;
      drawTree(x, t.y, t.w, t.h, t.trunkW, t.canopyH, trunkFill, leafFill);
      drawTree(x + W, t.y, t.w, t.h, t.trunkW, t.canopyH, trunkFill, leafFill);
    }
  }

  
  /**
   * LOGIC: drawForestBackground(state)
   * Render steps (in order):
   * 1) Paint the night-sky gradient.
   * 2) Sprinkle small pixel stars.
   * 3) Draw tree layers (far → mid → near) with different offsets.
   * 4) Draw fog blobs with a slower offset for depth.
   */
function drawForestBackground(state) {
    // sky gradient (pixel-friendly)
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f1535");
    grad.addColorStop(1, "#0b0f26");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // tiny pixel stars
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#e9ecff";
    for (let i = 0; i < 70; i++) {
      const x = (i * 137) % W;
      const y = (i * 89) % Math.floor(H * 0.45);
      const s = (i % 3) + 1;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;

    // Layers
    drawTreeLayer(forest.far, state.parallax.far, "rgba(20,30,60,0.85)", "rgba(30,45,85,0.85)");
    drawTreeLayer(forest.mid, state.parallax.mid, "rgba(18,35,55,0.90)", "rgba(35,70,55,0.90)");
    drawTreeLayer(forest.near, state.parallax.near, "rgba(25,20,30,0.92)", "rgba(40,95,60,0.92)");

    // light fog
    ctx.save();
    ctx.globalAlpha = 1;
    for (const b of forest.fog) {
      const x = (b.x - state.parallax.mid * 0.35 + W) % W;
      drawFogBlob(x, b.y, b.r, b.a);
      drawFogBlob(x + W, b.y, b.r, b.a);
    }
    ctx.restore();

    ctx.restore();
  }

  
  /**
   * LOGIC: draw({ state })
   * - Public function called by game.js each frame.
   * - Just forwards to drawForestBackground() using the current state.
   */
function draw({ state }) {
    drawForestBackground(state);
  }

  return { draw };
}
