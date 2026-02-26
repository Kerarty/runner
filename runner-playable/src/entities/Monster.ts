export class Monster {
  public x: number;
  public y = 654;

  public spriteWidth = 85;
  public spriteHeight = 120;

  public hitboxWidth = 45;
  public hitboxHeight = 70;
  public hitboxOffsetX = (this.spriteWidth - this.hitboxWidth) / 2;
  public hitboxOffsetY = (this.spriteHeight - this.hitboxHeight) / 2;

  public active = true;

  private sprite = new Image();

  private frameWidth = 146;   
  private frameHeight = 358;
  private frameCount = 10;

  private currentFrame = 0;
  private frameTimer = 0;
  private frameInterval = 0.9;

  constructor(x: number) {
    this.x = x;
    const robberUrl = new URL('../assets/robber1.png', import.meta.url).href;
    this.sprite.src = robberUrl;
  }

  update(dt: number, distance: number) {
    this.x -= 420 * dt;

    this.frameTimer += dt;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
  }

  draw(ctx: CanvasRenderingContext2D, distance: number) {
    const screenX = this.x - distance + 140;

    // ────────────────────────────────
    // УДАЛЕНА проверка if (screenX < -150 || screenX > 800) return;
    // Теперь рисуется всегда, если объект ещё в массиве

    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.drawImage(
        this.sprite,
        this.currentFrame * this.frameWidth,
        0,
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
}