import * as PIXI from 'pixi.js';
import konusPng from './assets/konus.png';

export class Obstacle {
  public readonly sprite: PIXI.Sprite;

  public x: number;
  public readonly y      = 682;
  public readonly width  = 68;
  public readonly height = 92;
  public active = true;

  constructor(x: number) {
    this.x = x;

    this.sprite = new PIXI.Sprite(PIXI.Texture.from(konusPng));
    this.sprite.width  = this.width;
    this.sprite.height = this.height;
    this.sprite.x      = x;
    this.sprite.y      = this.y;
  }

  update(dt: number): void {
    this.x -= 280 * dt;
    this.sprite.x = this.x;
  }
}