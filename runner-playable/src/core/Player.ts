export class Player {
  public x = 140;

  // ===== Масштаб =====
  private scale = 1.4;

  private baseWidth = 68;
  private baseHeight = 110;

  public width = this.baseWidth * this.scale;
  public height = this.baseHeight * this.scale;

  public y = 620;
  public vy = 0;

  private onGround = true;
  private gravity = 2200;
  private jumpForce = -920;

  private sprite = new Image();

  // ===== Fake run animation =====
  private runTime = 0;
  private runAmplitude = 6;
  private runSpeed = 14;

  // ===== Invulnerability =====
  private isInvulnerable = false;
  private invulnTimer = 0;
  private invulnDuration = 1; // 1 секунда

  constructor() {
    const characterUrl = new URL('../assets/character_run.png', import.meta.url).href;
    this.sprite.src = characterUrl;
  }

  // 👉 Вызывать при получении урона
  public takeDamage() {
    if (this.isInvulnerable) return;

    this.isInvulnerable = true;
    this.invulnTimer = this.invulnDuration;
  }

  public canTakeDamage(): boolean {
    return !this.isInvulnerable;
  }

  jump() {
    if (this.onGround) {
      this.vy = this.jumpForce;
      this.onGround = false;
    }
  }

  update(dt: number) {
    const groundY = 620;

    // Гравитация
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;

    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
    }

    // Анимация бега
    if (this.onGround) {
      this.runTime += dt;
    }

    // Таймер неуязвимости
    if (this.isInvulnerable) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.sprite.complete || this.sprite.naturalWidth === 0) {
      ctx.fillStyle = '#228B22';
      ctx.fillRect(this.x + 8, this.y + 20, 52, 60);
      return;
    }

    ctx.save();

    // ===== Bounce =====
    const bounce = this.onGround
      ? Math.sin(this.runTime * this.runSpeed) * this.runAmplitude
      : 0;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + bounce;

    ctx.translate(centerX, centerY);

    // ===== Tilt =====
    const tilt = this.onGround
      ? Math.sin(this.runTime * this.runSpeed) * 0.05
      : -0.15;

    ctx.rotate(tilt);

    // ===== Squash =====
    const scaleEffect = this.onGround
      ? 1 + Math.sin(this.runTime * this.runSpeed) * 0.03
      : 1.05;

    ctx.scale(scaleEffect, 1 / scaleEffect);

    // ===== Красное свечение + мигание =====
    if (this.isInvulnerable) {
      const flash = Math.sin(performance.now() * 0.03) > 0;

      if (flash) {
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 25;
      }
    }

    ctx.drawImage(
      this.sprite,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    ctx.restore();
  }

  collidesWith(other: any): boolean {
    return !(
      this.x + this.width < other.x ||
      this.x > other.x + other.width ||
      this.y + this.height < other.y ||
      this.y > other.y + other.height
    );
  }
}