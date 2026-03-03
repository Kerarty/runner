import * as PIXI from 'pixi.js';
import characterPng from './assets/character_run.png';

export class Player {
  public readonly container: PIXI.Container;
  private sprite!: PIXI.Sprite;

  public readonly x     = 140;
  public y              = 620;

  private readonly _baseW = 68;
  private readonly _baseH = 110;
  private readonly _scale = 1.4;
  public  readonly width:  number;
  public  readonly height: number;

  private baseSX = 1;
  private baseSY = 1;

  private vy                 = 0;
  private onGround           = true;
  private jumpLocked         = true;    // locked until first enemy appears
  private readonly gravity   = 2200;
  private readonly jumpForce = -1050;  // strong enough to clear hitboxTop=679 at freeze zone 380px
  private readonly groundY   = 620;

  private runTime           = 0;
  private readonly runAmp   = 6;
  private readonly runSpd   = 14;

  private invuln            = false;
  private invulnTimer        = 0;
  private readonly invulnDur = 1;

  constructor() {
    this.container = new PIXI.Container();
    this.width  = this._baseW * this._scale;
    this.height = this._baseH * this._scale;
  }

  init(): void {
    const texture = PIXI.Texture.from(characterPng);
    this.sprite   = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.width  = this.width;
    this.sprite.height = this.height;
    this.baseSX = this.sprite.scale.x;
    this.baseSY = this.sprite.scale.y;
    this.container.addChild(this.sprite);

    // Set initial position so sprite renders correctly before first update() call
    this.container.x = this.x + this.width  / 2;
    this.container.y = this.y + this.height / 2;
    this.container.rotation = 0;
  }

  /** Call once to allow jumping (after tutorial freeze) */
  unlockJump(): void { this.jumpLocked = false; }

  jump(): void {
    if (this.jumpLocked) return;
    if (this.onGround) { this.vy = this.jumpForce; this.onGround = false; }
  }

  takeDamage(): void {
    if (this.invuln) return;
    this.invuln = true; this.invulnTimer = this.invulnDur;
  }

  canTakeDamage(): boolean { return !this.invuln; }

  update(dt: number): void {
    this.vy += this.gravity * dt;
    this.y  += this.vy * dt;
    if (this.y >= this.groundY) {
      this.y = this.groundY; this.vy = 0; this.onGround = true;
    }
    if (this.onGround) this.runTime += dt;

    if (this.invuln) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0) {
        this.invuln = false; this.sprite.tint = 0xffffff; this.sprite.alpha = 1;
      }
    }

    const s      = Math.sin(this.runTime * this.runSpd);
    const bounce = this.onGround ? s * this.runAmp : 0;
    const tilt   = this.onGround ? s * 0.05 : -0.15;
    const squash = this.onGround ? 1 + s * 0.03 : 1.05;

    this.container.x        = this.x + this.width  / 2;
    this.container.y        = this.y + this.height / 2 + bounce;
    this.container.rotation = tilt;
    this.sprite.scale.x     = this.baseSX * squash;
    this.sprite.scale.y     = this.baseSY / squash;

    if (this.invuln) {
      const flash = Math.sin(performance.now() * 0.03) > 0;
      this.sprite.tint  = flash ? 0xff4444 : 0xffffff;
      this.sprite.alpha = flash ? 1.0 : 0.55;
    }
  }
}