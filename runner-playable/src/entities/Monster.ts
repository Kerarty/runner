export class Monster {
  public x: number;
  public y: number;
  public width = 52;
  public height = 52;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, cameraX: number) {
    this.x -= 380 * dt; // монстры бегут быстрее
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const screenX = this.x - cameraX + 120;
    ctx.fillStyle = '#4a148c';
    ctx.fillRect(screenX, this.y, this.width, this.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + 12, this.y + 12, 10, 10); // глаза
  }

  isOffscreen(cameraX: number): boolean {
    return this.x - cameraX + 120 < -100;
  }
}