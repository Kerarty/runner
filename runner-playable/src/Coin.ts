import * as PIXI from 'pixi.js';
import moneyPng from './assets/money.png';

export class Coin {
  public readonly sprite: PIXI.Sprite;

  /** World-space X position */
  public x: number;
  /** World-space Y position */
  public y: number;

  public readonly width  = 52;
  public readonly height = 52;
  public active = true;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    this.sprite = new PIXI.Sprite(PIXI.Texture.from(moneyPng));
    this.sprite.width  = this.width;
    this.sprite.height = this.height;
    this.sprite.x      = x;
    this.sprite.y      = y;
  }

  update(dt: number): void {
    this.x -= 280 * dt;
    this.sprite.x = this.x;   // worldContainer handles camera offset
  }
}