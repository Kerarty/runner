import * as PIXI from 'pixi.js';
import characterPng from './assets/Character1.png';

interface FrameData {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean; trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  anchor?: { x: number; y: number };
}
interface AtlasData {
  frames: Record<string, FrameData>;
  animations: Record<string, string[]>;
  meta: Record<string, any>;
}

const atlas: AtlasData = {
  frames: {
    "character/15-0":{ frame:{x:782,y:758, w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/15-1":{ frame:{x:2,  y:1015,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/15-2":{ frame:{x:132,y:1015,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/15-3":{ frame:{x:262,y:1015,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/15-4":{ frame:{x:392,y:1015,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/15-5":{ frame:{x:522,y:1015,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/15-6":{ frame:{x:652,y:1015,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/15-7":{ frame:{x:782,y:1015,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/16-0":{ frame:{x:2,  y:502, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-1":{ frame:{x:132,y:502, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-2":{ frame:{x:262,y:502, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-3":{ frame:{x:392,y:502, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-4":{ frame:{x:522,y:502, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-5":{ frame:{x:652,y:502, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-6":{ frame:{x:782,y:502, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-7":{ frame:{x:2,  y:758, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-8":{ frame:{x:132,y:758, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/16-9":{ frame:{x:262,y:758, w:130,h:256}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:256},sourceSize:{w:130,h:256} },
    "character/17-0":{ frame:{x:2,  y:1272,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/17-1":{ frame:{x:132,y:1272,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/17-2":{ frame:{x:262,y:1272,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/17-3":{ frame:{x:392,y:1272,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/17-4":{ frame:{x:522,y:1272,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
    "character/17-5":{ frame:{x:652,y:1272,w:130,h:257}, rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:130,h:257},sourceSize:{w:130,h:257} },
  },
  animations: {
    "character/15": ["character/15-0","character/15-1","character/15-2","character/15-3","character/15-4","character/15-5","character/15-6","character/15-7"],
    "character/16": ["character/16-0","character/16-1","character/16-2","character/16-3","character/16-4","character/16-5","character/16-6","character/16-7","character/16-8","character/16-9"],
    "character/17": ["character/17-0","character/17-1","character/17-2","character/17-3","character/17-4","character/17-5"],
  },
  meta: { app:"", version:"1.1", image:"Character1.png", format:"RGBA8888", size:{w:914,h:1532}, scale:"1" }
};

// character/15 = idle, character/16 = run, character/17 = jump/fall
const ANIM_IDLE = 'character/15';
const ANIM_RUN  = 'character/16';
const ANIM_JUMP = 'character/17';

// Скорости анимаций в кадрах в секунду
const FPS_IDLE = 7;
const FPS_RUN  = 14;
const FPS_JUMP = 10;

export class Player {
  public readonly container: PIXI.Container = new PIXI.Container();

  public x: number = 140;
  public y: number = 620;

  public readonly width:  number = 130;
  public readonly height: number = 256;

  // Вместо AnimatedSprite используем обычный Sprite + ручная прокрутка кадров
  private sprite!:  PIXI.Sprite;
  private textures: PIXI.Texture[] = [];   // текущий набор кадров
  private frameTime    = 0;   // накопленное время
  private frameDur     = 1 / FPS_IDLE; // длительность одного кадра в секундах
  private frameIndex   = 0;
  private frameLooping = true;
  private framePlaying = true;

  private currentState: 'idle' | 'run' | 'jump' | 'fall' = 'idle';

  private allAnims: Record<string, PIXI.Texture[]> = {};

  private vy         = 0;
  private onGround   = true;
  private jumpLocked = true;

  private readonly GRAVITY    = 2200;
  private readonly JUMP_FORCE = -1080;
  private readonly GROUND_Y   = 620;

  private squashTime = 0;

  public  invuln      = false;
  private invulnTimer = 0;
  private readonly INVULN_DURATION = 1.2;

  constructor() {}

  // ─── init ────────────────────────────────────────────────────────────────
  public async init(): Promise<void> {
    const texture = await PIXI.Assets.load<PIXI.Texture>(characterPng);
    const sheet   = new PIXI.Spritesheet(texture, atlas as any);
    await sheet.parse();

    // Сохраняем все анимации
    for (const key of [ANIM_IDLE, ANIM_RUN, ANIM_JUMP]) {
      this.allAnims[key] = sheet.animations[key] ?? [];
    }

    // Обычный Sprite — нет никаких проблем с ticker
    this.sprite = new PIXI.Sprite(this.allAnims[ANIM_IDLE][0]);
    this.sprite.anchor.set(0.5, 0.96);

    this.container.addChild(this.sprite);
    this.container.x = this.x;
    this.container.y = this.y;

    // Стартуем с idle
    this._playAnim(ANIM_IDLE, FPS_IDLE, true);
  }

  // ─── публичные методы ────────────────────────────────────────────────────
  public startRunning(): void {
    this.jumpLocked = true;
    this._setState('run');
  }

  public freeze(): void {
    this._setState('idle');
  }

  public unlockJump(): void { this.jumpLocked = false; }
  public lockJump():   void { this.jumpLocked = true;  }

  public jump(): void {
    if (!this.onGround || this.jumpLocked) return;
    this.vy       = this.JUMP_FORCE;
    this.onGround = false;
    this._setState('jump');
  }

  public takeDamage(): void {
    if (this.invuln) return;
    this.invuln      = true;
    this.invulnTimer = this.INVULN_DURATION;
  }

  // ─── update ──────────────────────────────────────────────────────────────
  public update(dt: number): void {
    if (!this.sprite) return;

    // ── Ручная прокрутка кадров ──────────────────────────────────────────
    if (this.framePlaying && this.textures.length > 1) {
      this.frameTime += dt;
      while (this.frameTime >= this.frameDur) {
        this.frameTime -= this.frameDur;
        if (this.frameLooping) {
          this.frameIndex = (this.frameIndex + 1) % this.textures.length;
        } else {
          if (this.frameIndex < this.textures.length - 1) {
            this.frameIndex++;
          } else {
            this.framePlaying = false; // анимация закончилась
          }
        }
      }
      this.sprite.texture = this.textures[this.frameIndex];
    }

    // ── Физика ───────────────────────────────────────────────────────────
    if (this.currentState !== 'idle') {
      this.vy += this.GRAVITY * dt;
      this.y  += this.vy * dt;

      if (this.y >= this.GROUND_Y) {
        if (!this.onGround) this.squashTime = 0.12;
        this.y        = this.GROUND_Y;
        this.vy       = 0;
        this.onGround = true;
        if (this.currentState !== 'run') this._setState('run');
      } else {
        this.onGround = false;
        if (this.vy > 0 && this.currentState !== 'fall') this._setState('fall');
      }
    }

    // ── Squash & stretch ─────────────────────────────────────────────────
    if (this.squashTime > 0) {
      this.squashTime -= dt;
      const p = Math.max(0, this.squashTime / 0.12);
      this.sprite.scale.set(1 + p * 0.08, 1 - p * 0.12);
    } else {
      this.sprite.scale.set(1, 1);
    }

    // ── Мигание при неуязвимости ─────────────────────────────────────────
    if (this.invuln) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0) {
        this.invuln       = false;
        this.sprite.alpha = 1;
        this.sprite.tint  = 0xffffff;
      } else {
        const flash       = Math.sin(performance.now() * 0.018) > 0;
        this.sprite.tint  = flash ? 0xff8888 : 0xffffff;
        this.sprite.alpha = flash ? 0.65 : 1;
      }
    }

    this.container.x = this.x;
    this.container.y = this.y;
  }

  // ─── приватные ───────────────────────────────────────────────────────────
  private _setState(state: 'idle' | 'run' | 'jump' | 'fall'): void {
    if (this.currentState === state) return;
    this.currentState = state;

    switch (state) {
      case 'idle': this._playAnim(ANIM_IDLE, FPS_IDLE, true);  break;
      case 'run':  this._playAnim(ANIM_RUN,  FPS_RUN,  true);  break;
      case 'jump': this._playAnim(ANIM_JUMP, FPS_JUMP, false); break;
      case 'fall':
        // Стоп на последнем кадре прыжка
        this.textures     = this.allAnims[ANIM_JUMP];
        this.frameIndex   = Math.max(0, this.textures.length - 1);
        this.framePlaying = false;
        if (this.textures.length) this.sprite.texture = this.textures[this.frameIndex];
        break;
    }
  }

  private _playAnim(animName: string, fps: number, loop: boolean): void {
    const frames = this.allAnims[animName];
    if (!frames?.length) { console.warn(`[Player] "${animName}" не найдена`); return; }
    this.textures      = frames;
    this.frameIndex    = 0;
    this.frameTime     = 0;
    this.frameDur      = 1 / fps;
    this.frameLooping  = loop;
    this.framePlaying  = true;
    this.sprite.texture = frames[0];
  }
}