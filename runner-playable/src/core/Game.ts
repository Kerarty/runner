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
      new Coin(900, 400),
      new Coin(1500, 450),
      new Monster(2200),
      new Coin(2800, 320),
      new Coin(3500, 500),
      new Monster(4100),
      new Coin(4800, 500),
      new Coin(5500, 400)
    ];

    initialEntities.forEach(e => e.active = true);
    this.entities = initialEntities;
  }

  public handlePointerDown(canvasX: number, canvasY: number) {
    
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

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];

      if (entity.isOffscreen?.(this.distance)) {
        this.entities.splice(i, 1);
        continue;
      }

      entity.update?.(dt, this.distance);

      const playerScreenX = this.player.x;
      const playerScreenY = this.player.y;

      let entityHitboxX = entity.x;
      let entityHitboxY = entity.y;
      let entityHitboxW = entity.width;
      let entityHitboxH = entity.height;

      if ('hitboxWidth' in entity && 'hitboxHeight' in entity) {
        entityHitboxW = entity.hitboxWidth;
        entityHitboxH = entity.hitboxHeight;
        if ('hitboxOffsetX' in entity) entityHitboxX += entity.hitboxOffsetX;
        if ('hitboxOffsetY' in entity) entityHitboxY += entity.hitboxOffsetY;
      }

      const entityScreenX = entityHitboxX - this.distance + this.cameraOffset;
      const entityScreenY = entityHitboxY;

      if (
        entity.active &&
        playerScreenX + this.player.width > entityScreenX &&
        playerScreenX < entityScreenX + entityHitboxW &&
        playerScreenY + this.player.height > entityScreenY &&
        playerScreenY < entityScreenY + entityHitboxH
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

    if (Math.random() < 0.03) {
      const x = this.distance + 850;
      const rand = Math.random();
      let newEntity;

      if (rand < 0.7) newEntity = new Coin(x, 450 + Math.random() * 120);
      else if (rand < 0.85) newEntity = new Obstacle(x);
      else newEntity = new Monster(x);

      newEntity.active = true;
      this.entities.push(newEntity);
    }

    if (this.distance > this.finishX) this.gameState = 'win';
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

    if (this.gameState === 'start') this.drawStartScreen();
    if (this.gameState === 'win') this.drawWinScreen();
    if (this.gameState === 'lose') this.drawLoseScreen();

    this.ctx.restore();

    this.drawOverlay();
  }

  private drawOverlay() {
    // ... (без изменений)
    let overlay = this.overlayContainer.querySelector('.start-overlay') as HTMLDivElement;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'start-overlay';
      overlay.innerHTML = ``;
      this.overlayContainer.appendChild(overlay);
    }

    overlay.style.display = this.gameState === 'start' ? 'flex' : 'none';
    overlay.style.width = `${this.canvas.width}px`;
    overlay.style.height = `${this.canvas.height}px`;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.textAlign = 'center';
    overlay.style.pointerEvents = 'none';
  }

  private drawStartScreen() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 52px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Tap to start', this.logicalWidth / 2, 420);
    this.ctx.fillText('earning!', this.logicalWidth / 2, 480);

    this.ctx.beginPath();
    this.ctx.arc(this.logicalWidth / 2 + 80, 620, 35, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawWinScreen() {
    this.drawConfetti();

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