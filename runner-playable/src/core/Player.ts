export class Player {
  public x = 140;
  public y = 620;
  public width = 68;
  public height = 110;
  public vy = 0;
  private onGround = true;
  private gravity = 2200;
  private jumpForce = -920;
  private sprite = new Image();

  constructor() {
    // Правильный способ для Vite + TypeScript
    const characterUrl = new URL('../assets/character_run.png', import.meta.url).href;
    this.sprite.src = characterUrl;
  }

  jump() {
    if (this.onGround) {
      this.vy = this.jumpForce;
      this.onGround = false;
    }
  }

  update(dt: number) {
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;

    if (this.y >= 620) {
      this.y = 620;
      this.vy = 0;
      this.onGround = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    } else {
      // fallback пока картинка грузится
      ctx.fillStyle = '#228B22';
      ctx.fillRect(this.x + 8, this.y + 20, 52, 60);
    }
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