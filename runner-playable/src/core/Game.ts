import { Player } from './Player';
import { Background } from './Background';
import { UIManager } from '../ui/UIManager';
import { Coin } from '../entities/Coin';
import { Obstacle } from '../entities/Obstacle';

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

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player();
    this.background = new Background();
    this.ui = new UIManager();

    this.spawnInitial();
  }

  private spawnInitial() {
    this.entities = [
      new Coin(900, 400),
      new Obstacle(1500),      // ← исправлено: только 1 аргумент
      new Coin(2200, 320),
      new Obstacle(2800),      // ← исправлено
      new Coin(3500, 500),
      new Obstacle(4200),      // ← исправлено
    ];
  }

  handleInput() {
    if (this.gameState === 'start') {
      this.gameState = 'playing';
      return;
    }
    if (this.gameState === 'playing') this.player.jump();
    if (this.gameState === 'win' || this.gameState === 'lose') {
      alert('✅ Redirecting to Playoff app store...');
    }
  }

  start() {
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
    this.balance += 8 * dt;

    this.player.update(dt);
    this.background.update(this.distance);   // теперь метод существует

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.update?.(dt, this.distance);   // безопасный вызов

      if (e.isOffscreen?.(this.distance)) {
        this.entities.splice(i, 1);
        continue;
      }

      if (this.player.collidesWith(e)) {
        if (e instanceof Coin) {
          this.balance += 45;
          this.entities.splice(i, 1);
        } else {
          this.health--;
          this.entities.splice(i, 1);
          if (this.health <= 0) this.gameState = 'lose';
        }
      }
    }

    if (Math.random() < 0.025) {
      const x = this.distance + 850;
      if (Math.random() < 0.5) this.entities.push(new Coin(x, 300 + Math.random() * 350));
      else this.entities.push(new Obstacle(x));
    }

    if (this.distance > this.finishX) this.gameState = 'win';
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.background.draw(this.ctx);
    this.entities.forEach(e => e.draw(this.ctx, this.distance));
    this.player.draw(this.ctx);
    this.ui.draw(this.ctx, this.health, Math.floor(this.balance), this.gameState);

    if (this.gameState === 'start') this.drawStartScreen();
    if (this.gameState === 'win') this.drawWinScreen();
    if (this.gameState === 'lose') this.drawLoseScreen();
  }

  private drawStartScreen() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 52px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Tap to start', this.canvas.width/2, 420);
    this.ctx.fillText('earning!', this.canvas.width/2, 480);

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width/2 + 80, 620, 35, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawWinScreen() {
    this.drawConfetti();
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 56px Arial';
    this.ctx.fillText('Congratulations!', this.canvas.width/2, 220);
    this.ctx.font = 'bold 34px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('Choose your reward!', this.canvas.width/2, 270);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.canvas.width/2 - 170, 320, 340, 180);
    this.ctx.fillStyle = '#003087';
    this.ctx.font = 'bold 42px Arial';
    this.ctx.fillText('PayPal', this.canvas.width/2, 390);
    this.ctx.font = 'bold 58px Arial';
    this.ctx.fillText(`$${Math.floor(this.balance)}`, this.canvas.width/2, 455);

    this.drawCTA('INSTALL AND EARN', '#FFCC00', 550);
  }

  private drawLoseScreen() {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillText("You didn't make it!", this.canvas.width/2, 320);
    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillText('Try again on the app!', this.canvas.width/2, 380);

    this.drawCTA('INSTALL AND EARN', '#FF4444', 520);
  }

  private drawCTA(text: string, color: string, y: number) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.canvas.width/2 - 180, y, 360, 90);
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText(text, this.canvas.width/2, y + 58);
  }

  private drawConfetti() {
    if (this.confetti.length === 0) {
      for (let i = 0; i < 120; i++) {
        this.confetti.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height - 300,
          vx: Math.random() * 6 - 3,
          vy: Math.random() * 8 + 4,
          color: ['#FFCC00', '#00A0FF', '#FF4444', '#00FF88'][Math.floor(Math.random()*4)],
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
      if (c.y > this.canvas.height) this.confetti.splice(i, 1);
    });
  }
}