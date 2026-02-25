export class Background {
  private bgImage = new Image();
  private scrollX = 0;

  constructor() {
    // Загружаем твою картинку background.png
    const bgUrl = new URL('../assets/background.png', import.meta.url).href;
    this.bgImage.src = bgUrl;
  }

  update(distance: number) {
    // Параллакс — фон движется в 2 раза медленнее игрока
    this.scrollX = distance * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      const canvasWidth = ctx.canvas.width;   // 640
      const canvasHeight = ctx.canvas.height; // 960
      const bgWidth = this.bgImage.width;

      // Зацикливаем фон (рисуем два раза)
      const offset = this.scrollX % bgWidth;

      ctx.drawImage(this.bgImage, -offset, 0, bgWidth, canvasHeight);
      ctx.drawImage(this.bgImage, bgWidth - offset, 0, bgWidth, canvasHeight);
    } else {
      // Fallback пока картинка грузится
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect(0, 0, 640, 960);
    }
  }
}