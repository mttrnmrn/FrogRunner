import { initGame } from './game.js';

export function initRunnerGame() {
  const canvas = document.getElementById('game');
  const scoreEl = document.getElementById('score');
  const coinsEl = document.getElementById('coins');
  const bestEl = document.getElementById('best');
  const muteBtn = document.getElementById('muteBtn');
  const volSlider = document.getElementById('volSlider');
  const fsBtn = document.getElementById('fsBtn');
  const startBtn = document.getElementById('startBtn');

  initGame({ canvas, scoreEl, coinsEl, bestEl, muteBtn, volSlider, fsBtn, startBtn });
}
