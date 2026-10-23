const KEY_BEST = 'runner_best';

/**
 * LOGIC: getBest()
 * - Reads the best score from localStorage.
 * - If nothing is stored yet, returns 0.
 */
export function getBest() {
  return Number(localStorage.getItem(KEY_BEST) || 0);
}

/**
 * LOGIC: setBest(v)
 * - Saves the best score to localStorage so it persists after refresh.
 */
export function setBest(v) {
  localStorage.setItem(KEY_BEST, String(v));
}
