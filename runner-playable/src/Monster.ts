import * as PIXI from 'pixi.js';

export class Monster {
  public readonly sprite: PIXI.AnimatedSprite;

  public x: number;

  // Ноги монстра на том же уровне земли что и у игрока (GROUND_Y = 774)
  public readonly spriteWidth  = 110;
  public readonly spriteHeight = 185;
  public readonly y = 774 - 185;  // = 589 — верх спрайта, ноги на 774

  public get width()  { return this.spriteWidth;  }
  public get height() { return this.spriteHeight; }

  // Хитбокс чуть меньше спрайта
  public readonly hitboxWidth    = 65;
  public readonly hitboxHeight   = 155;
  public readonly hitboxOffsetX: number;
  public readonly hitboxOffsetY: number;

  public active = true;

  // В файле robber1.png ровно 3 кадра в ряд
  private static readonly FRAME_COUNT = 3;

  constructor(x: number, texture: PIXI.Texture) {
    this.x = x;
    this.hitboxOffsetX = (this.spriteWidth  - this.hitboxWidth)  / 2;
    this.hitboxOffsetY = (this.spriteHeight - this.hitboxHeight) / 2;

    // Размер одного кадра вычисляется из реальных размеров текстуры
    const frameW = Math.floor(texture.width  / Monster.FRAME_COUNT);
    const frameH = texture.height;

    const frames: PIXI.Texture[] = [];

    for (let i = 0; i < Monster.FRAME_COUNT; i++) {
      frames.push(
        new PIXI.Texture({
          source: texture.source,
          frame: new PIXI.Rectangle(
            i * frameW,
            0,
            frameW,
            frameH,
          ),
        }),
      );
    }

    this.sprite = new PIXI.AnimatedSprite(frames);
    this.sprite.width          = this.spriteWidth;
    this.sprite.height         = this.spriteHeight;
    this.sprite.x              = x;
    this.sprite.y              = this.y;
    this.sprite.animationSpeed = 8 / 60;
    this.sprite.play();
  }

  update(dt: number): void {
    this.x       -= 420 * dt;
    this.sprite.x = this.x;
  }
}