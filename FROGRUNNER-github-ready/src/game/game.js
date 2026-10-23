import { ASSETS } from './assets.js';
import { getBest, setBest } from './storage.js';
import { ensureRoundRect } from './utils/canvas.js';
import { rand, clamp } from './utils/math.js';
import { aabb, circleRectCollision } from './utils/collision.js';
import { AudioManager } from './audio/AudioManager.js';
import { Player } from './entities/Player.js';
import { ObjectManager } from './entities/ObjectManager.js';
import { createSprites } from './render/Sprites.js';
import { createParallaxForest } from './render/ParallaxForest.js';

/**
 * Initializes the Canvas endless runner.
 * This file is adapted from your original game logic, but wrapped as an ES module.
 */
export function initGame({ canvas, scoreEl, coinsEl, bestEl, muteBtn, volSlider, fsBtn, startBtn }) {
  if (!canvas) throw new Error('Canvas not found');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;
  const groundY = Math.floor(H * 0.78);

  // ---------- extracted modules (organization only, no logic changes) ----------
  ensureRoundRect();

  const audioMgr = new AudioManager({ ASSETS, muteBtn });
  const sprites = createSprites({ ASSETS, ctx });
  const parallaxBg = createParallaxForest({ ctx, W, H });

  const player = new Player({ W, groundY });
  const objects = new ObjectManager({ W, groundY });
  let obstacles = objects.obstacles;
  let coins = objects.coins;

  // thin wrappers so the rest of the original code reads the same
  /**
 * LOGIC: resetPlayer()
 * - Puts the frog back to the default starting state.
 * - Clears jump velocity and restores “standing” height.
 * - Resets double-jump counter and ground flag.
 * - Used on first start and on restart after game over.
 */
function resetPlayer() { player.reset(); }
  /**
 * LOGIC: spawnObstacle()
 * - Creates one new obstacle object and pushes it into the obstacles list.
 * - Randomizes obstacle size (short vs tall) using the same probabilities as your original game.
 * - Spawns it just off the right edge so it slides into view.
 * - Does NOT move anything yet — update() handles movement each frame.
 */
function spawnObstacle() { objects.spawnObstacle(); }
  /**
 * LOGIC: spawnCoin()
 * - Creates one new coin and pushes it into the coins list.
 * - Chooses one of a few fixed heights so coins are “collectible arcs” above the ground.
 * - Spawns off the right edge; update() moves it left every frame.
 */
function spawnCoin() { objects.spawnCoin(); }


// ---------- GAME STATE ----------

const state = {
  running: false,
  gameOver: false,
  time: 0,
  score: 0,
  coins: 0,
  best: getBest(),

  speed: 420,
  gravity: 1900,

  obstacleTimer: 0,
  obstacleGapMin: 0.85,
  obstacleGapMax: 1.35,

  coinTimer: 0,
  coinGapMin: 0.55,
  coinGapMax: 1.05,

  parallax: { far: 0, mid: 0, near: 0, ground: 0 },

  // Run animation speed (lower = faster)r
  anim: { frame: 0, t: 0, rate: 0.06 },
};

bestEl.textContent = state.best;

// ---------- UI ----------
volSlider.addEventListener("input", () => audioMgr.setVolume(Number(volSlider.value)));
muteBtn.addEventListener("click", () => audioMgr.setMuted(!audioMgr.audio.muted));
fsBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await canvas.requestFullscreen();
    else await document.exitFullscreen();
  } catch (_) {}
});

if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (!state.running) startGame();
  });
}

// ---------- START / END ----------
/**
 * LOGIC: startGame()
 * - Moves the game from “not started / menu” into “running”.
 * - Resets timers, score, and object lists so the run starts clean.
 * - Starts background music (if not muted).
 */
function startGame() {
  audioMgr.bgMusic.currentTime = 0;
  audioMgr.bgMusic.play().catch(()=>{});

  state.running = true;
  state.gameOver = false;
  state.time = 0;
  state.score = 0;
  state.coins = 0;

  state.speed = 420;
  state.obstacleTimer = 0;
  state.coinTimer = 0;

  state.obstacleGapMin = 0.85;
  state.obstacleGapMax = 1.35;
  state.coinGapMin = 0.55;
  state.coinGapMax = 1.05;

  state.anim.frame = 0;
  state.anim.t = 0;

  objects.reset();
  resetPlayer();

  scoreEl.textContent = "0";
  coinsEl.textContent = "0";
  audioMgr.beep("start");
}

/**
 * LOGIC: endGame()
 * - Marks the run as finished (gameOver = true).
 * - Plays death SFX and stops/pauses movement updates.
 * - Updates “best score” storage if the current run beat the old best.
 */
function endGame() {
  audioMgr.bgMusic.pause();
  audioMgr.bgMusic.currentTime = 0;
  audioMgr.playDeath(); // moved: deathSound.play()
  

  state.running = false;
  state.gameOver = true;
  audioMgr.beep("hit");

  if (state.score > state.best) {
    state.best = state.score;
    setBest(state.best);
    bestEl.textContent = state.best;
  }
}

// ---------- INPUT ----------
/**
 * LOGIC: tryJump()
 * - If the player still has jumps left, apply an upward velocity (jumpStrength).
 * - Decrease jumpsLeft (supports double jump).
 * - If the player is on the ground, the first jump also flips onGround to false.
 * - Plays jump sound.
 */
function tryJump() {
  if (!state.running && !state.gameOver) { startGame(); return; }
  if (state.gameOver) return;

  if (player.jumpsLeft > 0) {

    player.vy = -player.jumpStrength;
    player.onGround = false;
    player.jumpsLeft--;
    audioMgr.playJump(); // moved: jumpSound.play()
    
  }
}


window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();

  if (k === " " || k === "arrowup" || k === "w") {
    e.preventDefault();
    if (!state.running && !state.gameOver) startGame();
    tryJump();
  }
  if (k === "r") startGame();
  if (k === "m") audioMgr.setMuted(!audioMgr.audio.muted);
});

canvas.addEventListener("pointerdown", () => {
  if (!state.running && !state.gameOver) startGame();
  tryJump();
});

// ---------- LOOP ----------
let last = performance.now();
/**
 * LOGIC: loop(t)
 * - The requestAnimationFrame loop.
 * - Computes delta time (dt) from the previous frame.
 * - Calls update(dt) then draw() every frame.
 */
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- UPDATE ----------
/**
 * LOGIC: update(dt)
 * This is the “simulation step” that runs once per frame.
 * In order:
 * 1) Advance timers (spawn timers, animation timers, score timer)
 * 2) Apply physics to the player (gravity → y position → ground snap)
 * 3) Move obstacles/coins left based on current speed
 * 4) Spawn new obstacles/coins if timers reached thresholds
 * 5) Detect collisions:
 *    - obstacle hit → endGame()
 *    - coin touch → mark taken + add coins + sound
 * 6) Remove off-screen obstacles/coins (cleanup)
 */
function update(dt) {
  // parallax offsets
  const baseScroll = (state.running && !state.gameOver) ? state.speed : 0;
  state.parallax.far    = (state.parallax.far    + baseScroll * 0.05 * dt) % W;
  state.parallax.mid    = (state.parallax.mid    + baseScroll * 0.10 * dt) % W;
  state.parallax.near   = (state.parallax.near   + baseScroll * 0.18 * dt) % W;
  state.parallax.ground = (state.parallax.ground + baseScroll * 0.60 * dt) % sprites.GROUND_DRAW;

  // run animation
  if (state.running && !state.gameOver && player.onGround) {
    state.anim.t += dt;
    if (state.anim.t >= state.anim.rate) {
      state.anim.t = 0;
      state.anim.frame = (state.anim.frame + 1) % sprites.FROG_FRAMES.run.length;
    }
  } else {
    state.anim.frame = 0;
    state.anim.t = 0;
  }

  if (!state.running || state.gameOver) return;

  state.time += dt;
  state.speed += 1 * dt;

  state.score = Math.floor(state.time * 10 + state.coins * 25);
  scoreEl.textContent = String(state.score);

  // player physics
  player.vy += state.gravity * dt;
  player.y += player.vy * dt;

  // ground
  const floor = groundY - player.h;
  if (player.y >= floor) {
    player.y = floor;
    player.vy = 0;
    if (!player.onGround) player.jumpsLeft = 2;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // spawns
  state.obstacleTimer -= dt;
  if (state.obstacleTimer <= 0) {
    spawnObstacle();
    state.obstacleTimer = rand(state.obstacleGapMin, state.obstacleGapMax);
    state.obstacleGapMin = Math.max(0.55, state.obstacleGapMin - 0.0025);
    state.obstacleGapMax = Math.max(0.90, state.obstacleGapMax - 0.0025);
  }

  state.coinTimer -= dt;
  if (state.coinTimer <= 0) {
    const cluster = Math.random() < 0.20 ? 3 : 1;
    for (let i = 0; i < cluster; i++) {
      spawnCoin();
      coins[coins.length - 1].x += i * 34;
    }
    state.coinTimer = rand(state.coinGapMin, state.coinGapMax);
    state.coinGapMin = Math.max(0.35, state.coinGapMin - 0.0018);
    state.coinGapMax = Math.max(0.70, state.coinGapMax - 0.0018);
  }

  // move
  const scroll = state.speed * dt;
  for (const o of obstacles) o.x -= scroll;
  for (const c of coins) c.x -= scroll;

  // cleanup
  obstacles = objects.obstacles = obstacles.filter(o => o.x + o.w > -80);
  coins = objects.coins = coins.filter(c => c.x + c.r > -50 && !c.taken);

  // collisions
  for (const o of obstacles) {
    if (aabb(player, o)) { endGame(); break; }
  }

  if (!state.gameOver) {
    const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const c of coins) {
      if (!c.taken && circleRectCollision(c, pRect)) {
        c.taken = true;
        state.coins++;
        coinsEl.textContent = String(state.coins);
        audioMgr.playCoin(); // moved: coinSound.play()
        
      }
    }
  }
}

// ---------- DRAW ----------

/**
 * LOGIC: drawForegroundGrass()
 * - Draws the simple grass strip on top of the ground line.
 * - Purely visual; does not affect collision.
 */
function drawForegroundGrass() {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.35;

  const TILE = sprites.GROUND_DRAW;
  const offset = (state.parallax.ground * 1.4) % TILE;

  for (let x = -offset; x < W + TILE; x += TILE) {
    ctx.drawImage(sprites.groundImg, 0, 0, 32, 16,
      Math.round(x), Math.round(groundY - 8),
      TILE, TILE / 2);
  }

  ctx.restore();
}

/**
 * LOGIC: drawHud()
 * - Updates the on-canvas HUD (score, coins, best) and game over overlay.
 * - This is separate from physics so visuals can still show even if gameOver.
 */
function drawHud() {
  // Draw HUD inside the canvas so it stays visible in fullscreen.
  const pad = 14;
  const x = 16;
  const y = 16;

  const scoreText = `Score: ${state.score}`;
  const coinText  = `Coins: ${state.coins}`;

  ctx.save();
  ctx.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const w = Math.max(ctx.measureText(scoreText).width, ctx.measureText(coinText).width) + pad * 2;
  const h = 52;

  // Backplate
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "#0b1220";
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }

  // Text
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#eaf2ff";
  ctx.fillText(scoreText, x + pad, y + 22);
  ctx.fillText(coinText,  x + pad, y + 44);

  ctx.restore();
}

/**
 * LOGIC: draw()
 * Render order matters. This draws one full frame in order:
 * 1) Background (parallax forest / sky layers)
 * 2) Hills/stars (if used)
 * 3) Ground tiles + grass strip
 * 4) Obstacles
 * 5) Coins
 * 6) Player sprite (frog)
 * 7) HUD / overlays (score, game over panel)
 */
function draw() {
  ctx.clearRect(0, 0, W, H);

  parallaxBg.draw({ state });

  drawGround();
  
  drawHud();

  for (const c of coins) drawCoin(c);
  for (const o of obstacles) drawObstacle(o);

  drawPlayer();

  if (!state.running && !state.gameOver) {
    drawCenterText("Press SPACE to Start", "Your frog sprite sheet is now used!");
  } else if (state.gameOver) {
    drawCenterText("Game Over", "Press R to restart (or SPACE).");
  }
}

function drawStars() {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#e9ecff";
  for (const s of bg.stars) ctx.fillRect(s.x, s.y, s.s, s.s);
  ctx.restore();
}

function drawHills(hills, offset, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  for (const h of hills) {
    const x1 = h.x - offset;
    drawHillShape(x1, h);
    drawHillShape(x1 + W, h);
  }
  ctx.restore();
}
function drawHillShape(x, h) {
  ctx.beginPath();
  ctx.ellipse(x, h.y, h.w, h.h, 0, 0, Math.PI * 2);
  ctx.fill();
}








function drawGround() {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const SRC = 32;                 // tile size in spritesheet
  const DST = sprites.GROUND_DRAW;        // draw size on canvas
  const offsetX = state.parallax.ground;

  // If image isn't loaded yet, draw a simple fallback so the ground never "disappears".
  if (!sprites.groundReady()) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.restore();
    return;
  }

  // ---- TOP GRASS (single clean strip) ----
  for (let x = -offsetX; x < W + DST; x += DST) {
    ctx.drawImage(
      sprites.groundImg,
      32, 0, SRC, SRC,                // middle grass tile
      Math.round(x), Math.round(groundY),
      DST, DST
    );
  }

  // ---- DIRT TRANSITION (just under grass) ----
  for (let x = -offsetX; x < W + DST; x += DST) {
    ctx.drawImage(
      sprites.groundImg,
      32, 32, SRC, SRC,               // upper dirt tile
      Math.round(x), Math.round(groundY + DST),
      DST, DST
    );
  }

  // ---- DEEP DIRT (repeat downward) ----
  const startY = groundY + DST * 2;
  const rows = Math.ceil((H - startY) / DST);

  for (let r = 0; r < rows; r++) {
    for (let x = -offsetX; x < W + DST; x += DST) {
      ctx.drawImage(
        sprites.groundImg,
        32, 64, SRC, SRC,             // deep dirt tile
        Math.round(x), Math.round(startY + r * DST),
        DST, DST
      );
    }
  }

  ctx.restore();
}








/**
 * LOGIC: drawObstacle(o)
 * - Draws one obstacle rectangle/sprite at its current x/y.
 * - Only uses the obstacle’s stored w/h; collision uses the same values.
 */
function drawObstacle(o) {
  const baseY = o.y + o.h;
  const spikeCount = Math.max(2, Math.floor(o.w / 18));
  const spikeW = o.w / spikeCount;

  ctx.fillStyle = "rgba(230, 240, 255, 0.95)";
  for (let i = 0; i < spikeCount; i++) {
    const x0 = o.x + i * spikeW;
    const x1 = x0 + spikeW * 0.5;
    const x2 = x0 + spikeW;
    ctx.beginPath();
    ctx.moveTo(x0, baseY);
    ctx.lineTo(x1, o.y);
    ctx.lineTo(x2, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // base plate
  ctx.fillStyle = "rgba(200, 210, 225, 0.95)";
  ctx.beginPath();
  ctx.roundRect(o.x, baseY - 8, o.w, 8, 4);
  ctx.fill();
}

/**
 * LOGIC: drawCoin(c)
 * - Draws one coin if it is not “taken”.
 * - Uses radius r for both drawing and collision.
 */
function drawCoin(c) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const SRC = 16;
  const FRAMES = 6;
  const frame = Math.floor((performance.now() / 120) % FRAMES);

  if (sprites.coinReady()) {
    ctx.drawImage(
      sprites.coinImg,
      frame * SRC, 0, SRC, SRC,
      Math.round(c.x - c.r),
      Math.round(c.y - c.r),
      c.r * 2,
      c.r * 2
    );
  } else {
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * LOGIC: drawPlayer()
 * - Chooses which frog animation frame to draw:
 *    * If in the air (onGround === false) → jump frame
 *    * Else if running → cycle run frames based on animation timer
 *    * Else → idle frame
 * - Then draws the chosen frame at player x/y using the same hitbox size.
 */
function drawPlayer() {
  // shadow
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#000";
  const shadowW = player.w * 0.8;
  ctx.beginPath();
  ctx.ellipse(player.x + player.w / 2, groundY + 8, shadowW, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // choose frame
  let frame = sprites.FROG_FRAMES.idle;
  // Sliding was removed; preserve the original priority:
  // jump (airborne) > run (running on ground) > idle.
  if (!player.onGround) frame = sprites.FROG_FRAMES.jump;
  else if (state.running && !state.gameOver) frame = sprites.FROG_FRAMES.run[state.anim.frame];

  // Subtle bobbing while running so the animation reads clearly.
  const isRun = (state.running && !state.gameOver && player.onGround);
  const bob = isRun ? (state.anim.frame % 2 === 0 ? 0 : 2) : 0;

  // draw with pixel-perfect scaling
  sprites.drawFrogFrame(frame, player.x, player.y + bob, player.w, player.h);
}

function drawCenterText(title, subtitle) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.roundRect(W * 0.18, H * 0.30, W * 0.64, H * 0.25, 18);
  ctx.fill();

  ctx.fillStyle = "#e9ecff";
  ctx.textAlign = "center";

  ctx.font = "800 40px system-ui";
  ctx.fillText(title, W / 2, H * 0.42);

  ctx.font = "500 16px system-ui";
  ctx.globalAlpha = 0.92;
  ctx.fillText(subtitle, W / 2, H * 0.49);

  ctx.restore();
}

// ---------- init UI state ----------
audioMgr.setVolume(Number(volSlider.value));
audioMgr.setMuted(false);

}