import * as PIXI from 'pixi.js';

export class Monster {
  public readonly sprite: PIXI.AnimatedSprite;

  public x: number;
  public readonly y = 654;

  public readonly spriteWidth  = 85;
  public readonly spriteHeight = 120;

  public get width()  { return this.spriteWidth;  }
  public get height() { return this.spriteHeight; }

  public readonly hitboxWidth    = 45;
  public readonly hitboxHeight   = 70;
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