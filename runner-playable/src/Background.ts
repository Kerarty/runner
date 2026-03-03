import * as PIXI from 'pixi.js';
import backgroundPng from './assets/background.png';

export class Background {
  public readonly container: PIXI.Container;
  private tilingSprite!: PIXI.TilingSprite;

  constructor() {
    this.container = new PIXI.Container();
  }

  async init(): Promise<void> {
    const texture = await PIXI.Assets.load<PIXI.Texture>(backgroundPng);
    // Start with a large enough tile — resize() will expand as needed
    this.tilingSprite = new PIXI.TilingSprite({ texture, width: 2000, height: 2000 });
    this.container.addChild(this.tilingSprite);
    // Initial scale: fill 960px height
    this._applyTileScale(960);
  }

  private _applyTileScale(targetH: number): void {
    if (!this.tilingSprite) return;
    const scale = targetH / this.tilingSprite.texture.height;
    this.tilingSprite.tileScale.set(scale, scale);
  }

  /**
   * Called every resize.
   * visibleW / visibleH — the FULL screen in LOCAL space of this container.
   * The tiling sprite is positioned so it covers the entire visible area
   * even if the game logical area (640×960) is smaller.
   */
  resize(visibleW: number, visibleH: number): void {
    if (!this.tilingSprite) return;
    // Expand tiling sprite to cover the full visible area
    this.tilingSprite.width  = Math.ceil(visibleW) + 4;
    this.tilingSprite.height = Math.ceil(visibleH) + 4;
    // Keep the tile scaled to the visible height for best proportions
    this._applyTileScale(visibleH);
    // Offset so top-left of tile aligns with top-left of visible area
    // (if visibleW > LW, the extra extends to the left)
    this.tilingSprite.x = 0;
    this.tilingSprite.y = 0;
  }

  update(distance: number): void {
    if (!this.tilingSprite) return;
    this.tilingSprite.tilePosition.x = -(distance * 0.5);
  }
}