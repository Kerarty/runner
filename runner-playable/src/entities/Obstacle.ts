export class Obstacle {
  public x: number;
  public y = 640;               // один уровень с дорогой (как девушка и грабитель)
  public width = 68;
  public height = 92;
  private sprite = new Image();

  constructor(x: number) {
    this.x = x;
    // Загружаем konus.png
    const konusUrl = new URL('../assets/konus.png', import.meta.url).href;
    this.sprite.src = konusUrl;
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
      // Fallback (если картинка ещё не загрузилась)
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.moveTo(screenX + 26, this.y);
      ctx.lineTo(screenX, this.y + 80);
      ctx.lineTo(screenX + 52, this.y + 80);
      ctx.closePath();
      ctx.fill();
    }
  }

  isOffscreen(distance: number): boolean {
    return this.x - distance + 140 < -100;
  }
}