export class UIManager {
  private heartImage = new Image();
  private moneyImage = new Image();

  constructor() {
    this.heartImage.src = new URL('../assets/health.png', import.meta.url).href;
    this.moneyImage.src = new URL('../assets/money.png', import.meta.url).href;
  }

  draw(ctx: CanvasRenderingContext2D, health: number, balance: number, gameState: string) {
    // ────────────────────────────── Верхняя панель ──────────────────────────────
    const panelGradient = ctx.createLinearGradient(0, 0, 0, 110);
    panelGradient.addColorStop(0, 'rgba(20, 20, 50, 0.82)');
    panelGradient.addColorStop(1, 'rgba(60, 20, 100, 0.68)');

    ctx.fillStyle = panelGradient;
    ctx.beginPath();
    ctx.roundRect(20, 18, 600, 88, 44);
    ctx.fill();

    // Лёгкая обводка панели
    ctx.strokeStyle = 'rgba(180, 140, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Сердечки слева
    for (let i = 0; i < 3; i++) {
      const x = 55 + i * 88;
      const y = 42;

      const pulse = health > i ? 1 + Math.sin(performance.now() * 0.0035 + i) * 0.05 : 1;

      ctx.shadowColor = health > i ? 'rgba(255, 80, 100, 0.75)' : 'transparent';
      ctx.shadowBlur = health > i ? 20 : 0;
      ctx.shadowOffsetY = 6;

      ctx.globalAlpha = health > i ? 1 : 0.32;
      ctx.drawImage(this.heartImage, x, y, 68 * pulse, 62 * pulse);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // ────────────────────────────── Reward блок (без обводки, цифры меньше, "Reward" выше) ──────────────────────────────
    const rewardX = 380;
    const rewardWidth = 240;
    const rewardHeight = 68;
    const rewardY = 32;

    ctx.fillStyle = 'rgba(30, 20, 60, 0.78)';
    ctx.beginPath();
    ctx.roundRect(rewardX, rewardY, rewardWidth, rewardHeight, 34);
    ctx.fill();

    // Иконка монеты
    const iconSize = 56;
    const iconY = rewardY + (rewardHeight - iconSize) / 2;
    ctx.drawImage(this.moneyImage, rewardX + 16, iconY, iconSize, iconSize);

    // Надпись "Reward" — поднята выше
    ctx.fillStyle = 'rgba(220, 220, 255, 0.92)';
    ctx.font = 'bold 21px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Reward', rewardX + 82, rewardY + 22);   // было +34 → теперь +28

    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`$${Math.floor(balance)}`, rewardX + 90, rewardY + 55);   // подогнано под новый размер

    // ────────────────────────────── Нижняя панель ──────────────────────────────
    const bottomGrad = ctx.createLinearGradient(0, 850, 0, 960);
    bottomGrad.addColorStop(0, '#2A004A');
    bottomGrad.addColorStop(1, '#4B0082');

    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 850, 640, 110);

    ctx.strokeStyle = 'rgba(180, 140, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 850);
    ctx.lineTo(640, 850);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('PLAYOFF', 40, 910);

    // DOWNLOAD — увеличена ширина до 180px, чтобы текст точно помещался
    const dlX = 440;
    const dlWidth = 180;
    const dlGrad = ctx.createLinearGradient(dlX, 865, dlX + dlWidth, 935);
    dlGrad.addColorStop(0, '#00d4ff');
    dlGrad.addColorStop(1, '#0095cc');

    ctx.shadowColor = 'rgba(0, 180, 255, 0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = dlGrad;
    ctx.beginPath();
    ctx.roundRect(dlX, 865, dlWidth, 78, 39);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';           // чуть уменьшен шрифт, если всё равно не влезает — можно до 27px
    ctx.textAlign = 'center';
    ctx.fillText('DOWNLOAD', dlX + dlWidth / 2, 910);
  }
}