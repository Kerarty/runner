export class FinishLine {
  public x: number;
  public y = 180;
  public width = 20;
  public height = 160;

  constructor(x: number) {
    this.x = x;
  }

  update(dt: number, cameraX: number) {
    this.x -= 320 * dt;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const screenX = this.x - cameraX + 120;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(screenX, this.y, this.width, this.height);
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(screenX - 10, this.y - 40, 40, 50); // флаг
  }

  isOffscreen(cameraX: number): boolean {
    return this.x - cameraX + 120 < -100;
  }
}