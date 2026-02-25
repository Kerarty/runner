export class Coin {
  public x: number;
  public y: number;
  public width = 48;
  public height = 48;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, distance: number) {
    this.x -= 280 * dt;
  }

  draw(ctx: CanvasRenderingContext2D, distance: number) {
    const screenX = this.x - distance + 140;
    if (screenX < -100 || screenX > 800) return;

    // PayPal кружок
    ctx.fillStyle = '#003087';
    ctx.beginPath();
    ctx.arc(screenX + 24, this.y + 24, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 38px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('P', screenX + 24, this.y + 37);
  }

  isOffscreen(distance: number): boolean {
    return this.x - distance + 140 < -100;
  }
}