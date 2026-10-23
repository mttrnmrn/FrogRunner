import { rand } from '../utils/math.js';

/**
 * LOGIC: ObjectManager
 * - Owns the “lists” of moving things in the runner (obstacles + coins).
 * - Only creates/clears objects here; movement/collisions are handled by game.js.
 */
export class ObjectManager {
  constructor({ W, groundY }) {
    this.W = W;
    this.groundY = groundY;
    this.obstacles = [];
    this.coins = [];
  }
  /**
   * LOGIC: reset()
   * - Clears obstacles and coins arrays without replacing the array objects.
   * - (Using length=0 keeps references valid if another file holds the same array.)
   */


  reset() {
    this.obstacles.length = 0;
    this.coins.length = 0;
  }
  /**
   * LOGIC: spawnObstacle()
   * - Randomly decides if the next obstacle is “tall” (25% chance).
   * - Uses random width/height ranges depending on tall vs short.
   * - Spawns it just outside the right edge so it enters smoothly.
   */


  spawnObstacle() {
    const tall = Math.random() < 0.25;
    const h = tall ? Math.floor(rand(60, 90)) : Math.floor(rand(36, 52));
    const w = tall ? Math.floor(rand(70, 110)) : Math.floor(rand(60, 95));

    this.obstacles.push({
      x: this.W + 40,
      y: this.groundY - h,
      w,
      h,
      type: "spike",
    });
  }
  /**
   * LOGIC: spawnCoin()
   * - Picks a coin height from 3 preset levels above the ground.
   * - Spawns it outside the right edge; game.js moves it left each frame.
   * - Coins start as {taken:false} so we can hide them after collection.
   */


  spawnCoin() {
    const yOptions = [ this.groundY - 90, this.groundY - 140, this.groundY - 190 ];
    const y = yOptions[Math.floor(Math.random() * yOptions.length)];
    this.coins.push({ x: this.W + 40, y, r: 12, taken: false });
  }
}
