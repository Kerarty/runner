export class Monster {
  public x: number;
  public y = 610;               // ← один уровень с девушкой
  public width = 85;
  public height = 120;
  private sprite = new Image();

  constructor(x: number) {
    this.x = x;
    const robberUrl = new URL('../assets/robber.png', import.meta.url).href;
    this.sprite.src = robberUrl;
  }

  update(dt: number, distance: number) {
    this.x -= 420 * dt;         // быстро навстречу
  }

  draw(ctx: CanvasRenderingContext2D, distance: number) {
    const screenX = this.x - distance + 140;
    if (screenX < -150 || screenX > 800) return;

    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.drawImage(this.sprite, screenX, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = '#4a148c';
      ctx.fillRect(screenX, this.y, this.width, this.height);
    }
  }

  isOffscreen(distance: number): boolean {
    return this.x - distance + 140 < -200;
  }
}