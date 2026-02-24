import { Application } from 'pixi.js';
import { Game } from './core/Game.ts';

const app = new Application();
await app.init({
  resizeTo: window,
  background: '#87CEEB',
  antialias: true,
});

document.getElementById('app')!.appendChild(app.canvas as HTMLCanvasElement);

const game = new Game(app);
await game.init();

app.ticker.add((time) => {
  game.update(time.deltaTime);
});

// Авто-ресайз
window.addEventListener('resize', () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
});