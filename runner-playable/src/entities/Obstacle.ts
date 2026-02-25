export class Obstacle {
  public x: number;
  public y = 570; // Подняли чуть выше, чтобы он стоял ровно на дороге
  public width = 70; // Размеры подгоняем под пропорции грабителя
  public height = 110;
  private sprite: HTMLImageElement;

  constructor(x: number) {
    this.x = x;
    this.sprite = new Image();
    // ⚠️ Помести картинку грабителя в папку public/assets/
    this.sprite.src = 'assets/robber.png';
  }

  update(dt: number, distance: number) {
    // Враг бежит нам навстречу, поэтому отнимаем позицию
    this.x -= 150 * dt; 
  }

  draw(ctx: CanvasRenderingContext2D, distance: number) {
    const screenX = this.x - distance + 140; 
    
    // Оптимизация: не рисуем, если враг за пределами экрана
    if (screenX < -150 || screenX > 800) return;

    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      // Рисуем спрайт грабителя
      ctx.drawImage(this.sprite, screenX, this.y, this.width, this.height);
    } else {
      // Запасной вариант: рисуем "грабителя" из прямоугольников (если картинки нет)
      ctx.fillStyle = '#333'; // Черно-белая кофта
      ctx.fillRect(screenX + 15, this.y + 30, 40, 50);
      ctx.fillStyle = '#fff'; // Полоски
      ctx.fillRect(screenX + 15, this.y + 40, 40, 10);
      ctx.fillRect(screenX + 15, this.y + 60, 40, 10);
      
      ctx.fillStyle = '#F4A460'; // Голова
      ctx.fillRect(screenX + 20, this.y, 30, 30);
    }
  }

  isOffscreen(distance: number): boolean {
    return this.x - distance + 140 < -150;
  }
}