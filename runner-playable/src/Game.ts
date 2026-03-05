import * as PIXI from 'pixi.js';
import { Background } from './Background';
import { Player }     from './Player';
import { UIManager }  from './Uimanager';
import { Coin }       from './Coin';
import { Monster }    from './Monster';
import { Obstacle }   from './Obstacle';

import backgroundPng from './assets/background.png';
import characterPng  from './assets/character.png';
import moneyPng      from './assets/money.png';
import healthPng     from './assets/health.png';
import konusPng      from './assets/konus.png';
import robberPng     from './assets/robber1.png';
import paypalPng     from './assets/PayPal.png';
import finishLinePng from './assets/finishline.png';
import bgMusicMp3    from './assets/background-music.mp3';
import winMp3        from './assets/win.mp3';
import loseMp3       from './assets/lose.mp3';

type Entity    = Coin | Monster | Obstacle;
type GameState = 'intro' | 'frozen' | 'playing' | 'win' | 'lose';
interface FT   { text: PIXI.Text; vy: number; elapsed: number; duration: number; }
interface FC   { sprite: PIXI.Sprite; tx: number; ty: number; progress: number; rotation: number; }

function mkText(t: string, s: Record<string, any>): PIXI.Text { return new PIXI.Text({ text: t, style: s }); }
function eW(e: Entity) { return (e as any).spriteWidth  ?? (e as any).width  ?? 100; }
function eH(e: Entity) { return (e as any).spriteHeight ?? (e as any).height ?? 100; }

const COIN_Y_MIN = 460;
const COIN_Y_MAX = 580;
const GROUND_Y   = 774;

export class Game {
  private readonly app: PIXI.Application;
  private readonly LW = 640;
  private readonly LH = 960;

  private bgLayer!:          PIXI.Container;
  private gameContainer!:    PIXI.Container;
  private worldContainer!:   PIXI.Container;
  private effectsContainer!: PIXI.Container;
  private clipMask!:         PIXI.Graphics;

  private screenOverlay!: PIXI.Graphics;
  private endContainer!:  PIXI.Container;

  private bg!:     Background;
  public player!: Player;           // добавляем public для доступа из других мест
  private ui!:     UIManager;

  private state:     GameState = 'intro';
  private balance    = 0;
  private health     = 3;
  private distance   = 0;
  private finishX    = 6200;
  private finishLine!: PIXI.TilingSprite;

  private lastDanger = -9999;
  private readonly CAM = 140;

  private entities:      Entity[] = [];
  private floatingTexts: FT[]     = [];
  private flyingCoins:   FC[]     = [];
  private coinTex!:      PIXI.Texture;
  private robberTex!:    PIXI.Texture;

  private confettiGfx!: PIXI.Graphics;
  private confettiData: { x:number;y:number;vx:number;vy:number;color:number;size:number }[] = [];

  private frozenTriggered = false;
  private coinsCollected  = 0;

  private winScreen!:    PIXI.Container;
  private loseScreen!:   PIXI.Container;
  private winBalText!:   PIXI.Text;
  private losBalText!:   PIXI.Text;
  private winSpotlight!: PIXI.Graphics;

  private loseTimerText!: PIXI.Text;
  private loseTimerValue  = 60;

  private bgMusic!:   HTMLAudioElement;
  private winSound!:  HTMLAudioElement;
  private loseSound!: HTMLAudioElement;

  private fitScale    = 1;
  private fitOffX     = 0;
  private fitOffY     = 0;
  private effectiveLW = 640;

  private spawnTimer      = 0;
  private spawnInterval   = 1.8;
  private patternIndex    = 0;

  constructor(app: PIXI.Application) { this.app = app; }

  async init(): Promise<void> {
    PIXI.TextureSource.defaultOptions.scaleMode = 'linear';

    this.clipMask = new PIXI.Graphics();
    this.app.stage.addChild(this.clipMask);

    this.bgLayer = new PIXI.Container();
    this.app.stage.addChild(this.bgLayer);

    this.gameContainer    = new PIXI.Container();
    this.worldContainer   = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.gameContainer.addChild(this.worldContainer, this.effectsContainer);
    this.app.stage.addChild(this.gameContainer);
    this.gameContainer.mask = this.clipMask;

    this.screenOverlay = new PIXI.Graphics();
    this.screenOverlay.visible = false;
    this.app.stage.addChild(this.screenOverlay);

    this.endContainer = new PIXI.Container();
    this.app.stage.addChild(this.endContainer);

    await PIXI.Assets.load(backgroundPng);
    await PIXI.Assets.load(healthPng);
    await PIXI.Assets.load(konusPng);
    await PIXI.Assets.load(paypalPng);

    this.coinTex   = await PIXI.Assets.load(moneyPng)     as PIXI.Texture;
    this.robberTex = await PIXI.Assets.load(robberPng)    as PIXI.Texture;

    this.bg = new Background();
    this.bgLayer.addChild(this.bg.container);
    await this.bg.init();

    this.player = new Player();
    await this.player.init();
    this.gameContainer.addChild(this.player.container); // ← игрок в фиксированном слое, не скроллится

    this.ui = new UIManager();
    this.ui.init();
    this.app.stage.addChild(this.ui.container);

    this._setupAudio();

    // Финишная линия
    const finishTex = await PIXI.Assets.load<PIXI.Texture>(finishLinePng);
    const FLW = this.effectiveLW;
    const FLH = 48;
    this.finishLine = new PIXI.TilingSprite({ texture: finishTex, width: FLW + 200, height: FLH });
    this.finishLine.tileScale.set(FLH / finishTex.height);
    this.finishLine.y = GROUND_Y - FLH;
    this.finishLine.x = this.finishX;
    this.finishLine.visible = false;
    this.worldContainer.addChild(this.finishLine);

    this._spawnInitial();
    this._buildWinScreen();
    this._buildLoseScreen();

    this._handleResize();

    const onResize = () => requestAnimationFrame(() => this._handleResize());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    (this.app.renderer as any).on?.('resize', () => this._handleResize());

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea   = new PIXI.Rectangle(0, 0, 100_000, 100_000);
    this.app.stage.on('pointerdown', () => this._onTap());

    this.ui.showHint('Tap to play!', 999);
  }

  start(): void {
    this.app.ticker.add(() => {
      const dt = Math.min(this.app.ticker.deltaMS / 1000, 0.1);
      this._update(dt);
    });
  }

  private _handleResize(): void {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    if (!sw || !sh) return;

    const fitScale  = sh / this.LH;
    this.fitScale   = fitScale;
    this.effectiveLW = Math.max(this.LW, Math.round(sw / fitScale));

    this.fitOffX = Math.round((sw - this.effectiveLW * fitScale) / 2);
    this.fitOffY = 0;

    const coverScale = Math.max(sw / this.LW, sh / this.LH);
    this.bgLayer.scale.set(coverScale);
    this.bg?.resize(sw / coverScale, sh / coverScale);

    this.gameContainer.scale.set(fitScale);
    this.gameContainer.x = this.fitOffX;
    this.gameContainer.y = this.fitOffY;

    this.endContainer.scale.set(fitScale);
    this.endContainer.x = this.fitOffX;
    this.endContainer.y = this.fitOffY;

    this.clipMask
      .clear()
      .fill({ color: 0xffffff })
      .rect(this.fitOffX, this.fitOffY, Math.ceil(this.effectiveLW * fitScale), Math.ceil(this.LH * fitScale))
      .fill();

    this.screenOverlay
      .clear()
      .fill({ color: 0x000000, alpha: 0.52 })
      .rect(0, 0, sw, sh)
      .fill();

    this.ui?.layout(sw, sh);

    if (this.finishLine) {
      this.finishLine.width = this.effectiveLW + 200;
    }
  }

  private _s2g(sx: number, sy: number) {
    return { x: (sx - this.fitOffX) / this.fitScale, y: (sy - this.fitOffY) / this.fitScale };
  }

  private _setupAudio(): void {
    try {
      this.bgMusic   = new Audio(bgMusicMp3); this.bgMusic.loop = true; this.bgMusic.volume = 0.35;
      this.winSound  = new Audio(winMp3);  this.winSound.volume = 0.7;
      this.loseSound = new Audio(loseMp3); this.loseSound.volume = 0.75;
    } catch {}
  }

  private _playMusic()  { this.bgMusic?.play().catch(() => {}); }
  private _stopMusic()  { this.bgMusic?.pause(); }
  private _playWin()    { this.winSound?.play().catch(() => {}); }
  private _playLose()   { this.loseSound?.play().catch(() => {}); }

  private _onTap(): void {
    if (this.state === 'intro') {
      this.worldContainer.x = this.CAM;
      this.state = 'playing';
      this.ui.hideHint();
      this._playMusic();
      this.player.startRunning(); // ← запуск бега
    } else if (this.state === 'frozen') {
      this.state = 'playing';
      this.ui.hideHint();
      this.player.unlockJump();
      this.player.jump();
    } else if (this.state === 'playing') {
      this.player.jump();
    } else {
      alert('Redirecting to Playoff app store...');
    }
  }

  private _offscreenX(offset = 200): number {
    return this.distance + this.effectiveLW + offset;
  }

  private _coinY(): number {
    return COIN_Y_MIN + Math.random() * (COIN_Y_MAX - COIN_Y_MIN);
  }

  private _spawnInitial(): void {
    const base = this._offscreenX(800);

    const items: Entity[] = [
      new Coin(base + 100,  this._coinY()),
      new Coin(base + 170,  this._coinY()),
      new Coin(base + 240,  this._coinY()),
      new Monster(base + 600, this.robberTex),
      new Coin(base + 950,  this._coinY()),
      new Coin(base + 1030, this._coinY()),
      new Coin(base + 1110, this._coinY()),
      new Obstacle(base + 1500),
      new Coin(base + 1850, this._coinY()),
      new Coin(base + 1930, this._coinY()),
      new Monster(base + 2400, this.robberTex),
      new Coin(base + 2900, this._coinY()),
      new Coin(base + 2970, this._coinY()),
      new Coin(base + 3040, this._coinY()),
      new Coin(base + 3110, this._coinY()),
    ];

    items.forEach(e => this._addEntity(e));
    this.lastDanger = base + 2400;
  }

  private _addEntity(e: Entity): void {
    e.active = true;
    this.entities.push(e);
    this.worldContainer.addChild(e.sprite);
  }

  private _removeEntity(e: Entity): void {
    this.worldContainer.removeChild(e.sprite);
    e.sprite.destroy();
  }

  private _spawnFlyingCoin(gx: number, gy: number): void {
    const { x:scx, y:scy } = this.ui.getBalanceCardCenter();
    const { x:tx,  y:ty  } = this._s2g(scx, scy);
    const s = new PIXI.Sprite(this.coinTex);
    s.anchor.set(0.5, 0.5);
    s.width = s.height = 44;
    s.x = gx;
    s.y = gy;
    this.effectsContainer.addChild(s);
    this.flyingCoins.push({ sprite: s, tx, ty, progress: 0, rotation: Math.random() * Math.PI * 2 });
  }

  private _spawnMilestone(msg: string): void {
    const txt = mkText(msg, {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 48,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 12,
      dropShadowDistance: 3,
      align: 'center'
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = this.effectiveLW / 2;
    txt.y = 360;
    txt.alpha = 0;
    this.effectsContainer.addChild(txt);
    this.floatingTexts.push({ text: txt, vy: -55, elapsed: 0, duration: 1.6 });
  }

  private _spawnPattern(): void {
    if (this.entities.length >= 40) return;

    const x   = this._offscreenX(300);
    const gap = 70;

    const patterns = [
      () => { for (let i = 0; i < 4; i++) this._addEntity(new Coin(x + i * gap, this._coinY())); },
      () => {
        const yBase = 640;
        const ys = [640, 590, 550, 590, 640];
        for (let i = 0; i < 5; i++) this._addEntity(new Coin(x + i * gap, ys[i]));
      },
      () => {
        this._addEntity(new Obstacle(x));
        for (let i = 0; i < 3; i++) this._addEntity(new Coin(x + 30 + i * 55, 520));
        this.lastDanger = this.distance;
      },
      () => {
        if (this.distance - this.lastDanger > 300) {
          this._addEntity(new Monster(x, this.robberTex));
          this.lastDanger = this.distance;
        }
      },
      () => {
        if (this.distance - this.lastDanger > 300) {
          this._addEntity(new Coin(x,        this._coinY()));
          this._addEntity(new Coin(x + 70,   this._coinY()));
          this._addEntity(new Monster(x + 180, this.robberTex));
          this._addEntity(new Coin(x + 330,  this._coinY()));
          this.lastDanger = this.distance;
        }
      },
      () => {
        const y = this._coinY();
        for (let i = 0; i < 3; i++) this._addEntity(new Coin(x + i * gap, y));
      },
      () => {
        for (let i = 0; i < 4; i++) {
          const y = i % 2 === 0 ? 560 : 680;
          this._addEntity(new Coin(x + i * gap, y));
        }
      },
      () => {
        if (this.distance - this.lastDanger > 400) {
          this._addEntity(new Obstacle(x));
          this._addEntity(new Monster(x + 320, this.robberTex));
          this.lastDanger = this.distance;
        }
      },
    ];

    const idx = this.patternIndex % patterns.length;
    patterns[idx]();
    this.patternIndex++;

    this.spawnInterval = Math.max(0.9, 1.8 - this.distance / 8000);
  }

  private _update(dt: number): void {
    this.ui.update(this.health, Math.floor(this.balance), dt);

    this.player.update(dt); // ← анимация работает всегда
    if (this.state === 'intro' || this.state === 'frozen') return;

    if (this.state === 'win') {
      if (this.confettiData.length > 0) this._updateConfetti();
      if (this.winSpotlight) this.winSpotlight.rotation += dt * 0.4;
      return;
    }

    if (this.state === 'lose') {
      if (this.loseTimerValue > 0) {
        this.loseTimerValue -= dt;
        if (this.loseTimerValue < 0) this.loseTimerValue = 0;
        const secs = Math.ceil(this.loseTimerValue);
        const mm = String(Math.floor(secs / 60)).padStart(2, '0');
        const ss = String(secs % 60).padStart(2, '0');
        this.loseTimerText.text = `${mm}:${ss}`;
      }
      return;
    }

    this.distance += 280 * dt;
    this.bg.update(this.distance);
    this.worldContainer.x = this.CAM - this.distance;

    // Frozen trigger
    if (!this.frozenTriggered) {
      const danger = this.entities.find(e => {
        if (!(e instanceof Monster || e instanceof Obstacle)) return false;
        const sl = e.x + this.worldContainer.x;
        return sl >= 380 && sl + eW(e) <= this.LW;
      });
      if (danger) {
        this.frozenTriggered = true;
        this.state = 'frozen';
        this.player.freeze(); // ← стоп анимации бега
        this.ui.showHint('Tap the screen\nto jump!', 999);
        return;
      }
    }

    // Обновление и коллизии
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];

      if (e.x + this.worldContainer.x + eW(e) < -200) {
        this._removeEntity(e);
        this.entities.splice(i, 1);
        continue;
      }

      e.update(dt);
      if (!e.active) continue;

      let hx = e.x, hy = e.y;
      const hw = (e as any).hitboxWidth ?? eW(e);
      const hh = (e as any).hitboxHeight ?? eH(e);
      if ('hitboxOffsetX' in e) hx += (e as any).hitboxOffsetX;
      if ('hitboxOffsetY' in e) hy += (e as any).hitboxOffsetY;

      const hesx = hx + this.worldContainer.x;
      // anchor(0.5,1.0): player.y = уровень ног, хитбокс считаем снизу вверх
      const pw = this.player.width  * 0.75;
      const ph = this.player.height * 0.85;
      const px = this.player.x - pw * 0.5;
      const py = this.player.y - ph;

      if (px + pw > hesx && px < hesx + hw && py + ph > hy && py < hy + hh) {
        if (e instanceof Coin) {
          this.balance += 45;
          this.coinsCollected++;
          this._spawnFlyingCoin(e.x + this.worldContainer.x + e.width / 2, e.y + e.height / 2);
          if (this.coinsCollected % 5 === 0) {
            const msgs = ['Awesome!', 'Keep going!', "You're rich!", 'Great!'];
            this._spawnMilestone(msgs[Math.floor(this.coinsCollected / 5 - 1) % msgs.length]);
          }
          this._removeEntity(e);
          this.entities.splice(i, 1);
          continue;
        }

        // Урон от монстра/препятствия
        if ((e instanceof Monster || e instanceof Obstacle) && !this.player.invuln) {
          this.player.takeDamage();
          this.health -= 1;
          e.active = false;
          if (this.health <= 0) {
            this.state = 'lose';
            this._stopMusic();
            this._playLose();
            this._showLoseScreen();
            return;
          }
        }
      }
    }

    // Спавн паттернов
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._spawnPattern();
    }

    // Показ финишной линии
    if (!this.finishLine.visible && this.distance > this.finishX - 800) {
      this.finishLine.visible = true;
    }

    if (this.distance > this.finishX) {
      this.state = 'win';
      this._stopMusic();
      this._playWin();
      this._showWinScreen();
    }

    // Летящие монеты
    for (let j = this.flyingCoins.length - 1; j >= 0; j--) {
      const c = this.flyingCoins[j];
      c.progress += dt * 3.5;
      if (c.progress >= 1) {
        this.effectsContainer.removeChild(c.sprite);
        c.sprite.destroy();
        this.flyingCoins.splice(j, 1);
        continue;
      }
      c.sprite.x += (c.tx - c.sprite.x) * 0.18;
      c.sprite.y += (c.ty - c.sprite.y) * 0.18;
      c.rotation += dt * 8;
      c.sprite.rotation = c.rotation;
      const ease = 1 - Math.pow(1 - c.progress, 3);
      c.sprite.alpha = Math.max(0.1, 1 - ease * 1.2);
      const sc = 1 - ease * 0.65;
      c.sprite.width = c.sprite.height = 44 * sc;
    }

    // Плавающие тексты
    for (let j = this.floatingTexts.length - 1; j >= 0; j--) {
      const ft = this.floatingTexts[j];
      ft.elapsed += dt;
      const p = ft.elapsed / ft.duration;
      ft.text.y += ft.vy * dt;
      ft.vy *= 0.96;
      ft.text.alpha = p < 0.15 ? p / 0.15 : p > 0.70 ? 1 - (p - 0.70) / 0.30 : 1;
      if (ft.elapsed >= ft.duration) {
        this.effectsContainer.removeChild(ft.text);
        ft.text.destroy();
        this.floatingTexts.splice(j, 1);
      }
    }
  }

  private _buildWinScreen(): void {
    if (!this.winScreen) {
      this.winScreen = new PIXI.Container();
      this.winScreen.visible = false;
      this.endContainer.addChild(this.winScreen);
    }
    const W = this.effectiveLW;
    const CX = W / 2;
    const H = this.LH;

    this.winSpotlight = new PIXI.Graphics();
    this.winSpotlight.pivot.set(CX, H);
    this.winSpotlight.x = CX;
    this.winSpotlight.y = H;
    for (let i = -1; i <= 1; i++) {
      const angle = i * 0.18;
      const g = new PIXI.Graphics();
      g.fill({ color: 0xffffff, alpha: 0.07 });
      g.moveTo(0, 0);
      g.lineTo(Math.sin(angle - 0.06) * H * 1.5, -H * 1.5);
      g.lineTo(Math.sin(angle + 0.06) * H * 1.5, -H * 1.5);
      g.closePath();
      g.fill();
      this.winSpotlight.addChild(g);
    }
    this.winScreen.addChild(this.winSpotlight);

    const t1 = mkText('Congratulations!', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 52,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 16,
      dropShadowDistance: 3,
      align: 'center'
    });
    t1.anchor.set(0.5, 0);
    t1.x = CX;
    t1.y = 130;
    this.winScreen.addChild(t1);

    const t2 = mkText('Choose your reward!', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 28,
      fill: 0xf0f0f0,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 2
    });
    t2.anchor.set(0.5, 0);
    t2.x = CX;
    t2.y = 196;
    this.winScreen.addChild(t2);

    const cardW = 420, cardH = 110, cardX = CX - 210, cardY = 260;
    const shadow = new PIXI.Graphics();
    shadow.fill({ color: 0x000000, alpha: 0.25 }).roundRect(cardX + 6, cardY + 8, cardW, cardH, cardH / 2).fill();
    this.winScreen.addChild(shadow);

    const ppSprite = new PIXI.Sprite(PIXI.Texture.from(paypalPng));
    ppSprite.x = cardX;
    ppSprite.y = cardY;
    ppSprite.width = cardW;
    ppSprite.height = cardH;
    this.winScreen.addChild(ppSprite);

    this.winBalText = mkText('$0', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 38,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x00205b,
      dropShadowBlur: 6,
      dropShadowDistance: 2
    });
    this.winBalText.anchor.set(0.5, 0.5);
    this.winBalText.x = cardX + cardW * 0.81;
    this.winBalText.y = cardY + cardH * 0.5;
    this.winScreen.addChild(this.winBalText);

    this.winScreen.addChild(this._makeCTA('INSTALL AND EARN', 0xff9500, 420));

    this.confettiGfx = new PIXI.Graphics();
    this.winScreen.addChild(this.confettiGfx);
  }

  private _showWinScreen(): void {
    this.winScreen.removeChildren();
    this._buildWinScreen();
    this.winBalText.text = `$${Math.floor(this.balance)}`;
    this.screenOverlay.visible = true;
    this.winScreen.visible = true;

    const colors = [0xFFCC00, 0x00A0FF, 0xFF4444, 0x00FF88, 0xFF69B4, 0xAA44FF];
    this.confettiData = Array.from({ length: 150 }, (_, i) => ({
      x: Math.random() * this.effectiveLW,
      y: -20 - Math.random() * 200,
      vx: Math.random() * 6 - 3,
      vy: Math.random() * 6 + 3,
      color: colors[i % colors.length],
      size: Math.random() * 10 + 5,
    }));
  }

  private _updateConfetti(): void {
    this.confettiGfx.clear();
    for (let i = this.confettiData.length - 1; i >= 0; i--) {
      const c = this.confettiData[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.2;
      if (c.y > this.LH) {
        this.confettiData.splice(i, 1);
        continue;
      }
      this.confettiGfx.fill({ color: c.color }).rect(c.x, c.y, c.size, c.size * 0.55).fill();
    }
  }

  private _buildLoseScreen(): void {
    if (!this.loseScreen) {
      this.loseScreen = new PIXI.Container();
      this.loseScreen.visible = false;
      this.endContainer.addChild(this.loseScreen);
    }
    const W = this.effectiveLW;
    const CX = W / 2;

    const t1 = mkText("You didn't make it!", {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 46,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 14,
      dropShadowDistance: 3,
      align: 'center'
    });
    t1.anchor.set(0.5, 0);
    t1.x = CX;
    t1.y = 150;
    this.loseScreen.addChild(t1);

    const t2 = mkText('Try again on the app!', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 26,
      fill: 0xf0f0f0,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 2
    });
    t2.anchor.set(0.5, 0);
    t2.x = CX;
    t2.y = 210;
    this.loseScreen.addChild(t2);

    const cardW = 420, cardH = 110, cardX = CX - 210, cardY = 280;
    const shadow = new PIXI.Graphics();
    shadow.fill({ color: 0x000000, alpha: 0.25 }).roundRect(cardX + 6, cardY + 8, cardW, cardH, cardH / 2).fill();
    this.loseScreen.addChild(shadow);

    const ppSprite = new PIXI.Sprite(PIXI.Texture.from(paypalPng));
    ppSprite.x = cardX;
    ppSprite.y = cardY;
    ppSprite.width = cardW;
    ppSprite.height = cardH;
    this.loseScreen.addChild(ppSprite);

    this.losBalText = mkText('$0', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 38,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x00205b,
      dropShadowBlur: 6,
      dropShadowDistance: 2
    });
    this.losBalText.anchor.set(0.5, 0.5);
    this.losBalText.x = cardX + cardW * 0.81;
    this.losBalText.y = cardY + cardH * 0.5;
    this.loseScreen.addChild(this.losBalText);

    const timerBoxW = 260, timerBoxH = 100, timerBoxX = CX - 130, timerBoxY = cardY + cardH + 24;
    const timerBox = new PIXI.Graphics();
    timerBox.fill({ color: 0x1a1a2e, alpha: 0.9 }).roundRect(timerBoxX, timerBoxY, timerBoxW, timerBoxH, 16).fill();
    timerBox.setStrokeStyle({ width: 2, color: 0x3a3a6e, alpha: 0.8 });
    timerBox.roundRect(timerBoxX, timerBoxY, timerBoxW, timerBoxH, 16).stroke();
    this.loseScreen.addChild(timerBox);

    this.loseTimerText = mkText('01:00', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 48,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowDistance: 2
    });
    this.loseTimerText.anchor.set(0.5, 0);
    this.loseTimerText.x = CX;
    this.loseTimerText.y = timerBoxY + 8;
    this.loseScreen.addChild(this.loseTimerText);

    const timerLabel = mkText('Next payment in one minute', {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 16,
      fill: 0xaaaacc
    });
    timerLabel.anchor.set(0.5, 0);
    timerLabel.x = CX;
    timerLabel.y = timerBoxY + timerBoxH - 24;
    this.loseScreen.addChild(timerLabel);

    this.loseScreen.addChild(this._makeCTA('INSTALL AND EARN', 0xdd2222, timerBoxY + timerBoxH + 24));
  }

  private _showLoseScreen(): void {
    this.loseScreen.removeChildren();
    this._buildLoseScreen();
    this.losBalText.text = `$${Math.floor(this.balance)}`;
    this.loseTimerValue = 60;
    this.loseTimerText.text = '01:00';
    this.screenOverlay.visible = true;
    this.loseScreen.visible = true;
  }

  private _makeCTA(label: string, color: number, y: number): PIXI.Container {
    const CX = this.effectiveLW / 2;
    const btnW = 380;
    const btnH = 80;
    const c = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.fill({ color }).roundRect(CX - btnW / 2, y, btnW, btnH, btnH / 2).fill();
    c.addChild(bg);

    const shine = new PIXI.Graphics();
    shine.fill({ color: 0xffffff, alpha: 0.15 }).roundRect(CX - btnW / 2, y, btnW, btnH / 2, btnH / 2).fill();
    c.addChild(shine);

    const txt = mkText(label, {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 28,
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: 0x00000066,
      dropShadowBlur: 4,
      dropShadowDistance: 2
    });
    txt.anchor.set(0.5, 0.5);
    txt.x = CX;
    txt.y = y + btnH / 2;
    c.addChild(txt);

    return c;
  }
}