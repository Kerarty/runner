// main.ts
import './style.css';
import { Game } from './core/Game';

const root = document.getElementById('app') ?? document.body;

const phoneWrapper = document.createElement('div');
phoneWrapper.className = 'phone-wrapper';

const phoneFrame = document.createElement('div');
phoneFrame.className = 'phone-frame';
phoneFrame.classList.add('model-iphone');

const canvas = document.createElement('canvas');
canvas.id = 'game';

const overlayContainer = document.createElement('div');
overlayContainer.className = 'overlay-container';

phoneFrame.appendChild(canvas);
phoneFrame.appendChild(overlayContainer);
phoneWrapper.appendChild(phoneFrame);
root.appendChild(phoneWrapper);

const phoneModelSelect = document.createElement('select');
phoneModelSelect.id = 'phone-model';
phoneModelSelect.innerHTML = `
  <option value="iphone">iPhone 14 Pro</option>
  <option value="android">Android</option>
  <option value="compact">Compact</option>
`;
root.appendChild(phoneModelSelect);

type PhoneModel = 'iphone' | 'android' | 'compact';

let game: Game | null = null;

function applyModel(model: PhoneModel) {
  phoneFrame.classList.remove('model-iphone', 'model-android', 'model-compact');
  phoneFrame.classList.add(`model-${model}`);
}

function resizeCanvas() {
  if (!game || !canvas) return;

  // физический размер = видимый размер × device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(canvas.clientWidth  * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);

  // можно вызвать метод из Game, если там есть дополнительная логика
  // game.resizeCanvas?.();   ← если добавишь такой метод в Game
}

function init() {
  applyModel('iphone');
  phoneModelSelect.value = 'iphone';

  game = new Game(canvas, overlayContainer);

  // первый ресайз
  resizeCanvas();

  // наблюдатель за изменением размеров рамки телефона
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(phoneFrame);

  // дополнительно — на ресайз окна
  window.addEventListener('resize', resizeCanvas);

  // запуск игрового цикла
  game.start();
}

phoneModelSelect.addEventListener('change', () => {
  const model = phoneModelSelect.value as PhoneModel;
  applyModel(model);
  // после смены модели — даём браузеру время перестроить layout
  setTimeout(resizeCanvas, 50);
});

// Обработка касаний / кликов
canvas.addEventListener('pointerdown', (event: PointerEvent) => {
  if (!game) return;

  event.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // переводим экранные координаты → логические координаты игры (640 × 960)
  const logicalX = ((event.clientX - rect.left) / rect.width)  * 640;
  const logicalY = ((event.clientY - rect.top)  / rect.height) * 960;

  game.handlePointerDown(logicalX, logicalY);
});

window.addEventListener('load', init);