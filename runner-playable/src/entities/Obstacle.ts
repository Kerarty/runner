export class Obstacle {
  public x: number;
  public y = 682;
  public width = 68;
  public height = 92;
  public active = true;
  private sprite = new Image();

  constructor(x: number) {
    this.x = x;
    const konusUrl = new URL('../assets/konus.png', import.meta.url).href;
    this.sprite.src = konusUrl;
  }

  update(dt: number, distance: number) {
    this.x -= 280 * dt;
  }

  draw(ctx: CanvasRenderingContext2D, distance: number) {
    const screenX = this.x - distance + 140;

    // ────────────────────────────────
    // УДАЛЕНА проверка if (screenX < -100 || screenX > 800) return;

    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.drawImage(this.sprite, screenX, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.moveTo(screenX + 26, this.y);
      ctx.lineTo(screenX, this.y + 80);
      ctx.lineTo(screenX + 52, this.y + 80);
      ctx.closePath();
      ctx.fill();
    }
  }
}