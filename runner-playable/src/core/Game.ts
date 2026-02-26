import { Player } from './Player';
import { Background } from './Background';
import { UIManager } from '../ui/UIManager';
import { Coin } from '../entities/Coin';
import { Obstacle } from '../entities/Obstacle';
import { Monster } from '../entities/Monster';

export class Game {
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private background: Background;
  private ui: UIManager;
  private entities: any[] = [];
  private gameState: 'start' | 'playing' | 'win' | 'lose' = 'start';
  private balance = 0;
  private health = 3;
  private distance = 0;
  private finishX = 6200;
  private confetti: any[] = [];

  private cameraOffset = 140;
  private overlayContainer: HTMLDivElement;

  private readonly logicalWidth = 640;
  private readonly logicalHeight = 960;

  private lastDangerousDistance: number = -9999;

  constructor(private canvas: HTMLCanvasElement, overlayContainer: HTMLDivElement) {
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player();
    this.background = new Background();
    this.ui = new UIManager();
    this.overlayContainer = overlayContainer;

    this.spawnInitial();
  }

  public resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
  }

  private spawnInitial() {
    const initialEntities = [
      new Coin(900, 480),
      new Coin(1500, 520),
      new Monster(2200),
      new Coin(2800, 460),
      new Coin(3500, 500),
      new Monster(4100),
      new Coin(4800, 520),
      new Coin(5500, 480)
    ];

    initialEntities.forEach(e => e.active = true);
    this.entities = initialEntities;
    this.lastDangerousDistance = 4100;
  }

  public handlePointerDown(canvasX: number, canvasY: number) {
    const logicalX = canvasX * (this.logicalWidth / this.canvas.clientWidth);
    const logicalY = canvasY * (this.logicalHeight / this.canvas.clientHeight);

    if (this.gameState === 'start') {
      this.gameState = 'playing';
      return;
    }

    if (this.gameState === 'playing') {
      this.player.jump();
      return;
    }

    if (this.gameState === 'win' || this.gameState === 'lose') {
      alert('Redirecting to Playoff app store...');
    }
  }

  public start() {
    let lastTime = 0;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      this.update(dt);
      this.draw();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private update(dt: number) {
    if (this.gameState !== 'playing') return;

    this.distance += 280 * dt;
    this.player.update(dt);
    this.background.update(this.distance);

    // Обновление и удаление сущностей
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];

      // ────────────────────────────────
      // Единая проверка на выход за левый край
      const screenX = entity.x - this.distance + this.cameraOffset;
      const w = entity.spriteWidth ?? entity.width ?? 100;
      const h = entity.spriteHeight ?? entity.height ?? 100;

      // Полностью ушёл за левый край + запас
      if (screenX + w < -150) {
        this.entities.splice(i, 1);
        continue;
      }

      // Обновляем сущность, если она ещё видна или близко к экрану
      if (screenX < this.logicalWidth + 200 && screenX + w > -200) {
        entity.update?.(dt, this.distance);
      }

      // Проверка коллизии
      const playerScreenX = this.player.x;
      const playerScreenY = this.player.y;

      let hitX = entity.x;
      let hitY = entity.y;
      let hitW = entity.width;
      let hitH = entity.height;

      if ('hitboxWidth' in entity && 'hitboxHeight' in entity) {
        hitW = entity.hitboxWidth;
        hitH = entity.hitboxHeight;
        if ('hitboxOffsetX' in entity) hitX += entity.hitboxOffsetX;
        if ('hitboxOffsetY' in entity) hitY += entity.hitboxOffsetY;
      }

      const entityScreenX = hitX - this.distance + this.cameraOffset;
      const entityScreenY = hitY;

      if (
        entity.active &&
        playerScreenX + this.player.width > entityScreenX &&
        playerScreenX < entityScreenX + hitW &&
        playerScreenY + this.player.height > entityScreenY &&
        playerScreenY < entityScreenY + hitH
      ) {
        if (entity instanceof Coin) {
          this.balance += 45;
          this.entities.splice(i, 1);
          continue;
        } else if (entity instanceof Obstacle || entity instanceof Monster) {
          if (this.player.canTakeDamage()) {
            this.player.takeDamage();
            this.health -= 1;
          }
          entity.active = false;
          if (this.health <= 0) {
            this.gameState = 'lose';
            return;
          }
        }
      }
    }

    // Спавн монеток
    if (Math.random() < 0.028) {
      const x = this.distance + 750 + Math.random() * 250;
      const y = 440 + Math.random() * 140;
      const coin = new Coin(x, y);
      coin.active = true;
      this.entities.push(coin);
    }

    // Спавн опасностей
    const minGap = 350;
    if (
      Math.random() < 0.032 &&
      this.distance - this.lastDangerousDistance > minGap &&
      this.entities.length < 35
    ) {
      const x = this.distance + 850;
      const rand = Math.random();
      let dangerous;

      if (rand < 0.65) {
        dangerous = new Obstacle(x);
      } else {
        dangerous = new Monster(x);
      }

      dangerous.active = true;
      this.entities.push(dangerous);
      this.lastDangerousDistance = this.distance;
    }

    if (this.distance > this.finishX) {
      this.gameState = 'win';
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    const scaleX = this.canvas.width / this.logicalWidth;
    const scaleY = this.canvas.height / this.logicalHeight;
    this.ctx.scale(scaleX, scaleY);

    this.background.draw(this.ctx);
    this.entities.forEach(e => e.draw(this.ctx, this.distance));
    this.player.draw(this.ctx);
    this.ui.draw(this.ctx, this.health, Math.floor(this.balance), this.gameState);

    if (this.gameState === 'start') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.35)';
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

      this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
      this.ctx.font = 'bold 52px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Tap anywhere', this.logicalWidth / 2, this.logicalHeight / 2 - 40);
      this.ctx.fillText('to start earning!', this.logicalWidth / 2, this.logicalHeight / 2 + 30);
    }

    if (this.gameState === 'win') this.drawWinScreen();
    if (this.gameState === 'lose') this.drawLoseScreen();

    this.ctx.restore();

    if (this.gameState === 'win') {
      this.ctx.save();
      this.ctx.scale(scaleX, scaleY);
      this.drawConfetti();
      this.ctx.restore();
    }
  }

  private drawWinScreen() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 56px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Congratulations!', this.logicalWidth / 2, 220);

    this.ctx.font = 'bold 34px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('Choose your reward!', this.logicalWidth / 2, 270);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.logicalWidth / 2 - 170, 320, 340, 180);

    this.ctx.fillStyle = '#003087';
    this.ctx.font = 'bold 42px Arial';
    this.ctx.fillText('PayPal', this.logicalWidth / 2, 390);

    this.ctx.font = 'bold 58px Arial';
    this.ctx.fillText(`$${Math.floor(this.balance)}`, this.logicalWidth / 2, 455);

    this.drawCTA('INSTALL AND EARN', '#FFCC00', 550);
  }

  private drawLoseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 52px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("You didn't make it!", this.logicalWidth / 2, 235);

    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillText('Try again on the app!', this.logicalWidth / 2, 285);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.roundRect(this.logicalWidth / 2 - 175, 325, 350, 205, 26);
    this.ctx.fill();

    this.ctx.fillStyle = '#003087';
    this.ctx.font = 'bold 46px Arial';
    this.ctx.fillText('PayPal', this.logicalWidth / 2, 395);

    this.ctx.font = 'bold 66px Arial';
    this.ctx.fillText(`$${Math.floor(this.balance)}`, this.logicalWidth / 2, 470);

    this.drawCTA('INSTALL AND EARN', '#FF4444', 565);
  }

  private drawCTA(text: string, color: string, y: number) {
    const btnWidth = 340;
    const btnHeight = 78;
    const x = this.logicalWidth / 2 - btnWidth / 2;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, btnWidth, btnHeight, 40);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.logicalWidth / 2, y + 52);
  }

  private drawConfetti() {
    if (this.confetti.length === 0) {
      for (let i = 0; i < 120; i++) {
        this.confetti.push({
          x: Math.random() * this.logicalWidth,
          y: Math.random() * this.logicalHeight - 300,
          vx: Math.random() * 6 - 3,
          vy: Math.random() * 8 + 4,
          color: ['#FFCC00', '#00A0FF', '#FF4444', '#00FF88'][Math.floor(Math.random() * 4)],
          size: Math.random() * 12 + 6
        });
      }
    }

    this.confetti.forEach((c, i) => {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.3;
      this.ctx.fillStyle = c.color;
      this.ctx.fillRect(c.x, c.y, c.size, c.size * 0.6);
      if (c.y > this.logicalHeight) this.confetti.splice(i, 1);
    });
  }
}