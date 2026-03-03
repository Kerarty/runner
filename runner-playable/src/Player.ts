import * as PIXI from 'pixi.js';
import characterPng from './assets/character_run3.png';

export class Player {
  public readonly container: PIXI.Container;
  private sprite!: PIXI.AnimatedSprite;

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
  private jumpLocked         = true;
  private readonly gravity   = 2200;
  private readonly jumpForce = -1050;
  private readonly groundY   = 620;

  // Беговая анимация управляется через AnimatedSprite,
  // поэтому runTime нужен только для bounce/tilt
  private runTime           = 0;
  private readonly runAmp   = 6;
  private readonly runSpd   = 14;

  private invuln            = false;
  private invulnTimer        = 0;
  private readonly invulnDur = 1;

  // Параметры спрайтшита character_run2.png
  private static readonly FRAME_COUNT = 2;
  private static readonly FRAME_W     = 336;
  private static readonly FRAME_H     = 478;

  constructor() {
    this.container = new PIXI.Container();
    this.width  = this._baseW * this._scale;
    this.height = this._baseH * this._scale;
  }

  init(): void {
    const base   = PIXI.Texture.from(characterPng);
    const frames: PIXI.Texture[] = [];

    for (let i = 0; i < Player.FRAME_COUNT; i++) {
      frames.push(
        new PIXI.Texture({
          source: base.source,
          frame:  new PIXI.Rectangle(
            i * Player.FRAME_W,
            0,
            Player.FRAME_W,
            Player.FRAME_H,
          ),
        }),
      );
    }

    this.sprite = new PIXI.AnimatedSprite(frames);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.width  = this.width;
    this.sprite.height = this.height;

    // ~12 fps — плавная беговая анимация
    this.sprite.animationSpeed = 6 / 60;
    this.sprite.play();

    this.baseSX = this.sprite.scale.x;
    this.baseSY = this.sprite.scale.y;

    this.container.addChild(this.sprite);

    this.container.x = this.x + this.width  / 2;
    this.container.y = this.y + this.height / 2;
    this.container.rotation = 0;
  }

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

    // Анимация: бежит на земле, пауза в прыжке
    if (this.onGround) {
      this.runTime += dt;
      if (!this.sprite.playing) this.sprite.play();
    } else {
      // В прыжке — фиксируем на втором кадре (фаза полёта)
      if (this.sprite.playing) {
        this.sprite.stop();
        this.sprite.currentFrame = 1;
      }
    }

    if (this.invuln) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0) {
        this.invuln = false; this.sprite.tint = 0xffffff; this.sprite.alpha = 1;
      }
    }

    // Bounce и tilt — только на земле
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