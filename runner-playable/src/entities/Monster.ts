export class Monster {
  public x: number;
  // выравниваем "ноги" монстра с игроком
  public y = 654;

  // Размер отрисовки на канвасе
  public spriteWidth = 85;
  public spriteHeight = 120;

  // ===== Hitbox =====
  public hitboxWidth = 45;
  public hitboxHeight = 70;
  public hitboxOffsetX = (this.spriteWidth - this.hitboxWidth) / 2;
  public hitboxOffsetY = (this.spriteHeight - this.hitboxHeight) / 2;

  public active = true;

  private sprite = new Image();

  // ===== Sprite animation =====
  private frameWidth = 156;   
  private frameHeight = 358;
  private frameCount = 10;

  private currentFrame = 0;
  private frameTimer = 0;
  private frameInterval = 0.08; // скорость анимации (сек)
  // =============================

  constructor(x: number) {
    this.x = x;
    const robberUrl = new URL('../assets/robber1.png', import.meta.url).href;
    this.sprite.src = robberUrl;
  }

  update(dt: number, distance: number) {
    // движение
    this.x -= 420 * dt;

    // анимация
    this.frameTimer += dt;

    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.currentFrame++;

      if (this.currentFrame >= this.frameCount) {
        this.currentFrame = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, distance: number) {
    const screenX = this.x - distance + 140;
    if (screenX < -150 || screenX > 800) return;

    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.drawImage(
        this.sprite,
        this.currentFrame * this.frameWidth, // sx
        0,                                   // sy
        this.frameWidth,
        this.frameHeight,
        screenX,
        this.y,
        this.spriteWidth,
        this.spriteHeight
      );
    } else {
      ctx.fillStyle = '#4a148c';
      ctx.fillRect(screenX, this.y, this.spriteWidth, this.spriteHeight);
    }
  }

  isOffscreen(distance: number): boolean {
    return this.x - distance + 140 < -200;
  }
}