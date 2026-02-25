export class UIManager {
  draw(ctx: CanvasRenderingContext2D, health: number, balance: number, gameState: string) {
    // сердца (3 розовых)
    ctx.fillStyle = '#FF69B4';
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 70;
      ctx.beginPath();
      ctx.arc(x + 12, 60, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 3, 55, 18, 18);
      if (i + 1 > health) ctx.fillStyle = '#444';
    }
    ctx.fillStyle = '#FF69B4';

    // PayPal баланс
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`$${Math.floor(balance)}`, 600, 68);

    ctx.fillStyle = '#003087';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('PayPal', 600, 38);

    // нижняя панель (всегда видна)
    ctx.fillStyle = '#6A1B9A';
    ctx.fillRect(0, 850, 640, 110);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Playoff', 40, 910);

    // PayPal иконка снизу
    ctx.fillStyle = '#003087';
    ctx.beginPath();
    ctx.arc(380, 895, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('P', 368, 915);

    // кнопка DOWNLOAD
    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(460, 870, 160, 60);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DOWNLOAD', 540, 905);
  }
}