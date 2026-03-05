import * as PIXI from 'pixi.js';
import characterPng  from './assets/Character_1.png';
import characterJson from './assets/Character_1.json';

/**
 * Анимации из Character_1.json:
 *   Sprite/1         → RUN  (10 кадров — настоящий бег с движением ног)
 *   Sprite/3         → IDLE (10 кадров — стойка с лёгким покачиванием)
 *   Sprite/character → JUMP (используем кадры 1-5 — бег с раскинутыми руками/ногами)
 */
export class Player {
  public readonly container: PIXI.Container = new PIXI.Container();

  // x — центр персонажа по горизонтали
  // y — уровень ног (anchor 0.5, 1.0 → y = низ спрайта)
  public x = 140;
  public y = 774;

  // Хитбокс для коллизий в Game.ts
  public readonly width  = 90;
  public readonly height = 210;

  private idleAnim!:    PIXI.AnimatedSprite;
  private runAnim!:     PIXI.AnimatedSprite;
  private jumpAnim!:    PIXI.AnimatedSprite;
  private currentAnim!: PIXI.AnimatedSprite;

  private state: 'idle' | 'run' | 'jump' = 'idle';

  private vy         = 0;
  private onGround   = true;
  private jumpLocked = true;

  private readonly G        = 2200;
  private readonly JF       = -1100;  // увеличено: прыжок 275px — перелетает монстра (185px)
  private readonly GROUND_Y = 774;

  private squashTime = 0;
  public  invuln     = false;
  private invulnT    = 0;
  private readonly INVULN     = 1.2;
  private readonly BASE_SCALE = 0.88;

  constructor() {}

  public async init(): Promise<void> {
    const texture = await PIXI.Assets.load<PIXI.Texture>(characterPng);
    const sheet   = new PIXI.Spritesheet(texture, characterJson as any);
    await sheet.parse();

    console.log('[Player] Animations:', Object.keys(sheet.animations));

    // Sprite/1 → RUN (10 кадров бега)
    const runFrames  = sheet.animations['Sprite/1'];

    // Sprite/3 → IDLE (10 кадров стойки)
    const idleFrames = sheet.animations['Sprite/3'];

    // Sprite/character → JUMP: берём кадры 1-4 (бег с руками вперёд — имитация прыжка)
    const allJumpFrames = sheet.animations['Sprite/character'];
    const jumpFrames    = allJumpFrames.slice(1, 6); // кадры 1..5 — персонаж в движении

    if (!runFrames?.length || !idleFrames?.length || !jumpFrames?.length) {
      console.error('[Player] Animations not found!', sheet.animations);
      return;
    }

    this.runAnim  = new PIXI.AnimatedSprite(runFrames);
    this.idleAnim = new PIXI.AnimatedSprite(idleFrames);
    this.jumpAnim = new PIXI.AnimatedSprite(jumpFrames);

    for (const anim of [this.runAnim, this.idleAnim, this.jumpAnim]) {
      // anchor(0.5, 1.0): центр по X, низ по Y → ноги стоят ровно на container.y
      anim.anchor.set(0.5, 1.0);
      // scale вместо width/height — не ломает позицию
      anim.scale.set(this.BASE_SCALE);
      anim.visible = false;
      this.container.addChild(anim);
    }

    this.runAnim.animationSpeed  = 0.15;   // бег — быстро
    this.idleAnim.animationSpeed = 0.08;   // idle — медленное покачивание
    this.jumpAnim.animationSpeed = 0.20;   // прыжок
    this.jumpAnim.loop = false;            // прыжок не зацикливаем

    this.container.x = this.x;
    this.container.y = this.y;

    this._setState('idle');
    console.log('[Player] Init done');
  }

  /** Первый тап — начало бега */
  public startRunning(): void {
    this.jumpLocked = true;
    this._setState('run');
  }

  /** Заморозка на туториале — стоп */
  public freeze(): void {
    this._setState('idle');
  }

  public unlockJump(): void { this.jumpLocked = false; }
  public lockJump():   void { this.jumpLocked = true; }

  public jump(): void {
    if (!this.onGround || this.jumpLocked) return;
    this.vy = this.JF;
    this.onGround = false;
    this._setState('jump');
  }

  public takeDamage(): void {
    if (this.invuln) return;
    this.invuln  = true;
    this.invulnT = this.INVULN;
  }

  public update(dt: number): void {
    this._updatePhysics(dt);
    this._applyVisualEffects(dt);
    this.container.x = this.x;
    this.container.y = this.y;
  }

  private _updatePhysics(dt: number): void {
    if (this.state === 'idle') return;

    this.vy += this.G * dt;
    this.y  += this.vy * dt;

    if (this.y >= this.GROUND_Y) {
      if (!this.onGround) this.squashTime = 0.15;
      this.y        = this.GROUND_Y;
      this.vy       = 0;
      this.onGround = true;
      if (this.state !== 'run') this._setState('run');
    } else {
      this.onGround = false;
      // Фиксируем на последнем кадре прыжка при падении
      if (this.state === 'jump' && this.vy > 80 && this.currentAnim?.playing) {
        this.currentAnim.stop();
      }
    }
  }

  private _applyVisualEffects(dt: number): void {
    const anim = this.currentAnim;
    if (!anim) return;

    // Squash & stretch при приземлении
    if (this.squashTime > 0) {
      this.squashTime -= dt;
      const p = Math.max(0, this.squashTime / 0.15);
      anim.scale.set(
        this.BASE_SCALE * (1 + p * 0.14),
        this.BASE_SCALE * (1 - p * 0.18),
      );
    } else {
      anim.scale.set(this.BASE_SCALE);
    }

    // Мигание при неуязвимости
    if (this.invuln) {
      this.invulnT -= dt;
      const done  = this.invulnT <= 0;
      if (done) this.invuln = false;
      const flash = Math.sin(performance.now() * 0.022) > 0;
      anim.alpha = done ? 1 : (flash ? 0.45 : 1);
      anim.tint  = done ? 0xffffff : (flash ? 0xff6666 : 0xffffff);
    } else {
      anim.alpha = 1;
      anim.tint  = 0xffffff;
    }
  }

  private _setState(newState: 'idle' | 'run' | 'jump'): void {
    if (this.state === newState && this.currentAnim?.playing) return;
    this.state = newState;

    if (this.currentAnim) {
      this.currentAnim.visible = false;
      this.currentAnim.stop();
    }

    switch (newState) {
      case 'idle': this.currentAnim = this.idleAnim; break;
      case 'run':  this.currentAnim = this.runAnim;  break;
      case 'jump': this.currentAnim = this.jumpAnim; break;
    }

    this.currentAnim.visible = true;
    this.currentAnim.gotoAndPlay(0);
    console.log(`[Player] state → ${newState}`);
  }
}