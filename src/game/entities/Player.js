/**
 * LOGIC: Player
 * - Holds only the frog’s physics state (position, velocity, size, jump count).
 * - Does NOT draw itself and does NOT handle collisions by itself.
 * - game.js reads/writes these fields each frame.
 */
export class Player {
  constructor({ W, groundY }) {
    // identical defaults from original (except sliding removed as requested)
    this.x = Math.floor(W * 0.18);
    this.groundY = groundY;

    this.y = groundY - 64;
    this.w = 54;
    this.h = 64;

    this.vy = 0;
    this.jumpsLeft = 2;
    this.onGround = true;

    this.jumpStrength = 760;

    this.standH = 64;
  }
  /**
   * LOGIC: reset()
   * - Restores the player to a “fresh run” state:
   *   1) Put frog back on top of the ground.
   *   2) Clear vertical speed (vy = 0).
   *   3) Set onGround = true.
   *   4) Restore double jump (jumpsLeft = 2).
   *   5) Restore standing hitbox height.
   */


  reset() {
    this.y = this.groundY - this.standH;
    this.vy = 0;
    this.onGround = true;
    this.jumpsLeft = 2;
    this.h = this.standH;
  }
}
