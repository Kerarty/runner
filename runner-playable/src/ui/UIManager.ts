export class UIManager {
  private heartImage = new Image();
  private moneyImage = new Image();

  constructor() {
    this.heartImage.src = new URL('../assets/health.png', import.meta.url).href;
    this.moneyImage.src = new URL('../assets/money.png', import.meta.url).href;
  }

  draw(ctx: CanvasRenderingContext2D, health: number, balance: number, gameState: string) {
    // === СЕРДЕЧКИ СЛЕВА ===
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 72;

      if (i < health) {
        // полное сердце
        ctx.globalAlpha = 1;
        ctx.drawImage(this.heartImage, x, 45, 58, 52);
      } else {
        // потраченное сердце (серое)
        ctx.globalAlpha = 0.35;
        ctx.drawImage(this.heartImage, x, 45, 58, 52);
      }
    }
    ctx.globalAlpha = 1;

    // === БАЛАНС СПРАВА с иконкой денег ===
    // иконка денег
    ctx.drawImage(this.moneyImage, 460, 38, 48, 48);

    // текст баланса
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 46px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`$${Math.floor(balance)}`, 520, 72);

    ctx.fillStyle = '#003087';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('PayPal', 520, 42);

    // нижняя панель (остаётся как была)
    ctx.fillStyle = '#6A1B9A';
    ctx.fillRect(0, 850, 640, 110);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Playoff', 40, 910);

    ctx.fillStyle = '#003087';
    ctx.beginPath();
    ctx.arc(380, 895, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('P', 368, 915);

    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(460, 870, 160, 60);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DOWNLOAD', 540, 905);
  }
}