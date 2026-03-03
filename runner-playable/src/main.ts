import './style.css';
import * as PIXI from 'pixi.js';
import { Game } from './Game';

(async () => {
  // Гарантируем правильный viewport на мобилках — запрещаем zoom браузера
  let viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

  const app = new PIXI.Application();

  await app.init({
    resizeTo:    window,
    background:  0x000000,
    resolution:  window.devicePixelRatio || 1,
    autoDensity: true,
    antialias:   false,
  });

  const appEl = document.getElementById('app') ?? document.body;
  appEl.appendChild(app.canvas);

  const cv = app.canvas as HTMLCanvasElement;
  cv.style.position = 'absolute';
  cv.style.top      = '0';
  cv.style.left     = '0';
  cv.style.width    = '100%';
  cv.style.height   = '100%';

  const game = new Game(app);
  await game.init();
  game.start();
})();