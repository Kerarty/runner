export class Coin {
  public x: number;
  public y: number;
  public width = 52;
  public height = 52;
  public active = true;          // добавлено
  private sprite = new Image();

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite.src = new URL('../assets/money.png', import.meta.url).href;
  }

  update(dt: number, distance: number) {
    this.x -= 280 * dt;
  }

  draw(ctx: CanvasRenderingContext2D, distance: number) {
    const screenX = this.x - distance + 140;
    if (screenX < -100 || screenX > 800) return;

    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.drawImage(this.sprite, screenX, this.y, this.width, this.height);
    } else {
      // fallback
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(screenX, this.y, this.width, this.height);
    }
  }

  isOffscreen(distance: number): boolean {
    return this.x - distance + 140 < -100;
  }
}