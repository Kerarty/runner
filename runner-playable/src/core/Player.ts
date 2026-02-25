export class Player {
  public x = 140;
  public y = 620;
  public width = 68;
  public height = 110;
  public vy = 0;
  private onGround = true;
  private gravity = 2200;
  private jumpForce = -920;

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
    // девушка (зелёная кофта, как в референсе)
    ctx.fillStyle = '#228B22';           // зелёная кофта
    ctx.fillRect(this.x + 8, this.y + 20, 52, 60); // тело

    ctx.fillStyle = '#F4A460';           // кожа
    ctx.fillRect(this.x + 18, this.y + 8, 32, 28); // голова

    ctx.fillStyle = '#8B4513';           // волосы
    ctx.fillRect(this.x + 12, this.y + 4, 44, 22);

    // пончик/хвостик
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(this.x + 48, this.y + 18, 14, 0, Math.PI * 2);
    ctx.fill();

    // ноги (анимация простая)
    ctx.fillStyle = '#4B2E1A';
    ctx.fillRect(this.x + 18, this.y + 75, 14, 35);
    ctx.fillRect(this.x + 38, this.y + 75, 14, 35);
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