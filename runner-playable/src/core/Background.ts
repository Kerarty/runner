export class Background {
  private bgImage: HTMLImageElement;
  private scrollX = 0;

  constructor() {
    this.bgImage = new Image();
    // ⚠️ Обязательно помести картинку парка с макета в папку public/assets/
    this.bgImage.src = 'assets/background_park.png'; 
  }

  update(distance: number) {
    // Умножаем на 0.5, чтобы фон двигался медленнее игрока (эффект глубины)
    this.scrollX = distance * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Проверяем, загрузилась ли картинка
    if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      const canvasWidth = ctx.canvas.width; // Обычно 640
      const canvasHeight = ctx.canvas.height; // Обычно 960
      const bgWidth = this.bgImage.width || 1280; // Ширина самой картинки
      
      // Вычисляем, насколько сдвинуть фон
      const offsetX = this.scrollX % bgWidth;
      
      // Рисуем картинку дважды, чтобы зациклить её без "швов"
      ctx.drawImage(this.bgImage, -offsetX, 0, bgWidth, canvasHeight);
      ctx.drawImage(this.bgImage, bgWidth - offsetX, 0, bgWidth, canvasHeight);
    } else {
      // Запасной вариант (Fallback), пока картинка грузится
      this.drawFallback(ctx);
    }
  }

  private drawFallback(ctx: CanvasRenderingContext2D) {
    // Светлое небо
    ctx.fillStyle = '#FFE4E1';
    ctx.fillRect(0, 0, 640, 960);
    
    // Дорога и асфальт из макета (серо-синий)
    ctx.fillStyle = '#5C5C8A';
    ctx.fillRect(0, 600, 640, 360);
    
    // Белая линия на дороге
    ctx.fillStyle = '#E6E6FA';
    ctx.fillRect(0, 630, 640, 15);
  }
}