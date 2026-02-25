export class Background {
  private bgImage = new Image();
  private scrollX = 0;

  constructor() {
    const bgUrl = new URL('../assets/background.png', import.meta.url).href;
    this.bgImage.src = bgUrl;
  }

  update(distance: number) {
    this.scrollX = distance * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      const logicalHeight = 960;
      const bgWidth = this.bgImage.width;
      const offset = this.scrollX % bgWidth;

      ctx.drawImage(this.bgImage, -offset, 0, bgWidth, logicalHeight);
      ctx.drawImage(this.bgImage, bgWidth - offset, 0, bgWidth, logicalHeight);
    } else {
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect(0, 0, 640, 960);
    }
  }
}