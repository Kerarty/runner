import * as PIXI from 'pixi.js';
import { Background } from './Background';
import { Player }     from './Player';
import { UIManager }  from './Uimanager';
import { Coin }       from './Coin';
import { Monster }    from './Monster';
import { Obstacle }   from './Obstacle';

import backgroundPng from './assets/background.png';
import characterPng  from './assets/character_run.png';
import moneyPng      from './assets/money.png';
import healthPng     from './assets/health.png';
import konusPng      from './assets/konus.png';
import robberPng     from './assets/robber1.png';
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

export class Game {
  private readonly app: PIXI.Application;
  private readonly LW = 640;
  private readonly LH = 960;

  private bgLayer!:          PIXI.Container;
  private gameContainer!:    PIXI.Container;
  private worldContainer!:   PIXI.Container;
  private effectsContainer!: PIXI.Container;
  private overlayContainer!: PIXI.Container;

  private bg!:     Background;
  private player!: Player;
  private ui!:     UIManager;

  private state:     GameState = 'intro';
  private balance    = 0;
  private health     = 3;
  private distance   = 0;
  private finishX    = 6200;
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

  private winScreen!:  PIXI.Container;
  private loseScreen!: PIXI.Container;
  private winBalText!: PIXI.Text;
  private losBalText!: PIXI.Text;

  private bgMusic!:   HTMLAudioElement;
  private winSound!:  HTMLAudioElement;
  private loseSound!: HTMLAudioElement;

  private fitScale = 1;
  private fitOffX  = 0;
  private fitOffY  = 0;

  constructor(app: PIXI.Application) { this.app = app; }

  async init(): Promise<void> {
    PIXI.TextureSource.defaultOptions.scaleMode = 'linear';

    this.bgLayer = new PIXI.Container();
    this.app.stage.addChild(this.bgLayer);

    this.gameContainer    = new PIXI.Container();
    this.worldContainer   = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.overlayContainer = new PIXI.Container();
    this.gameContainer.addChild(this.worldContainer, this.effectsContainer, this.overlayContainer);
    this.app.stage.addChild(this.gameContainer);

    // ── Маска в ЛОКАЛЬНЫХ координатах gameContainer (0,0 → LW,LH) ──────────
    // Она масштабируется вместе с контейнером — пересчитывать при resize не нужно.
    // Маска должна быть в дереве отображения, поэтому добавляем в gameContainer.
    const clipMask = new PIXI.Graphics();
    clipMask.fill({ color: 0xffffff }).rect(0, 0, this.LW, this.LH).fill();
    this.gameContainer.addChild(clipMask);
    this.gameContainer.mask = clipMask;

    await PIXI.Assets.load(backgroundPng);
    await PIXI.Assets.load(characterPng);
    await PIXI.Assets.load(healthPng);
    await PIXI.Assets.load(konusPng);

    this.coinTex   = await PIXI.Assets.load(moneyPng)  as PIXI.Texture;
    this.robberTex = await PIXI.Assets.load(robberPng) as PIXI.Texture;

    if (!this.robberTex || this.robberTex.width === 0) {
      console.warn('robberTex failed to load, using fallback');
      const gfx = new PIXI.Graphics().fill(0xff0000).rect(0, 0, 85, 120).fill();
      this.robberTex = this.app.renderer.generateTexture(gfx);
    }

    this.bg = new Background();
    this.bgLayer.addChild(this.bg.container);
    await this.bg.init();

    this.player = new Player();
    this.player.init();
    this.gameContainer.addChild(this.player.container);

    this.ui = new UIManager();
    this.ui.init();
    this.app.stage.addChild(this.ui.container);

    this._setupAudio();
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

    // ── Background: COVER ─────────────────────────────────────────────────
    const coverScale = Math.max(sw / this.LW, sh / this.LH);
    this.bgLayer.scale.set(coverScale);
    this.bgLayer.x = 0;
    this.bgLayer.y = 0;
    this.bg?.resize(sw / coverScale, sh / coverScale);

    // ── Game content: FIT ──────────────────────────────────────────────────
    // Маска пересчитывать не нужно — она в локальных координатах (0,0,LW,LH)
    // и автоматически масштабируется вместе с gameContainer.
    const fitScale = Math.min(sw / this.LW, sh / this.LH);
    this.fitScale  = fitScale;
    this.fitOffX   = Math.round((sw - this.LW * fitScale) / 2);
    this.fitOffY   = Math.round((sh - this.LH * fitScale) / 2);
    this.gameContainer.scale.set(fitScale);
    this.gameContainer.x = this.fitOffX;
    this.gameContainer.y = this.fitOffY;

    // ── UI: screen space ───────────────────────────────────────────────────
    this.ui?.layout(sw, sh);
  }

  private _s2g(sx: number, sy: number) {
    return {
      x: (sx - this.fitOffX) / this.fitScale,
      y: (sy - this.fitOffY) / this.fitScale,
    };
  }

  private _setupAudio(): void {
    try { this.bgMusic   = new Audio(bgMusicMp3); this.bgMusic.loop=true; this.bgMusic.volume=0.35; } catch(_){}
    try { this.winSound  = new Audio(winMp3);  this.winSound.volume=0.7;   } catch(_){}
    try { this.loseSound = new Audio(loseMp3); this.loseSound.volume=0.75; } catch(_){}
  }
  private _playMusic()  { this.bgMusic?.play().catch(()=>{}); }
  private _stopMusic()  { this.bgMusic?.pause(); }
  private _playWin()    { if(this.winSound)  { this.winSound.currentTime=0;  this.winSound.play().catch(()=>{}); } }
  private _playLose()   { if(this.loseSound) { this.loseSound.currentTime=0; this.loseSound.play().catch(()=>{}); } }

  private _onTap(): void {
    if (this.state==='intro') {
      this.worldContainer.x = this.CAM;
      this.state = 'playing'; this.ui.hideHint(); this._playMusic();
    } else if (this.state==='frozen') {
      this.state = 'playing'; this.ui.hideHint();
      this.player.unlockJump(); this.player.jump();
    } else if (this.state==='playing') {
      this.player.jump();
    } else {
      alert('Redirecting to Playoff app store...');
    }
  }

  private _spawnInitial(): void {
    // Правый край видимой области в мировых координатах при distance=0:
    // rightEdge = LW - CAM = 500. +300 буфер = 800 от начала мира.
    const offscreen = this.LW - this.CAM + 300;

    [
      new Coin(offscreen + 200,  480),
      new Coin(offscreen + 600,  520),
      new Monster(offscreen + 1100, this.robberTex),
      new Coin(offscreen + 1700, 460),
      new Coin(offscreen + 2400, 500),
      new Monster(offscreen + 3100, this.robberTex),
      new Coin(offscreen + 3700, 520),
      new Coin(offscreen + 4400, 480),
    ].forEach(e => this._addEntity(e));

    this.lastDanger = offscreen + 3100;
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
    const { x: scx, y: scy } = this.ui.getBalanceCardCenter();
    const { x: tx,  y: ty  } = this._s2g(scx, scy);
    const s = new PIXI.Sprite(this.coinTex);
    s.anchor.set(0.5, 0.5); s.width = s.height = 44; s.x = gx; s.y = gy;
    this.effectsContainer.addChild(s);
    this.flyingCoins.push({ sprite:s, tx, ty, progress:0, rotation:Math.random()*Math.PI*2 });
  }

  private _spawnMilestone(msg: string): void {
    const txt = mkText(msg, {
      fontFamily:'Arial', fontWeight:'bold', fontSize:48, fill:0xffffff,
      dropShadow:true, dropShadowColor:0x000000, dropShadowBlur:12,
      dropShadowDistance:3, align:'center',
    });
    txt.anchor.set(0.5, 0.5); txt.x = this.LW/2; txt.y = 360; txt.alpha = 0;
    this.effectsContainer.addChild(txt);
    this.floatingTexts.push({ text:txt, vy:-55, elapsed:0, duration:1.6 });
  }

  private _update(dt: number): void {
    this.ui.update(this.health, Math.floor(this.balance), dt);

    if (this.state==='intro' || this.state==='frozen') return;
    if (this.state==='win')  { if (this.confettiData.length>0) this._updateConfetti(); return; }
    if (this.state==='lose') return;

    this.distance += 280 * dt;
    this.player.update(dt);
    this.bg.update(this.distance);
    this.worldContainer.x = this.CAM - this.distance;

    if (!this.frozenTriggered) {
      const d = this.entities.find(e => {
        if (!(e instanceof Monster || e instanceof Obstacle)) return false;
        const sl = e.x + this.worldContainer.x;
        return sl >= 380 && sl + eW(e) <= this.LW;
      });
      if (d) {
        this.frozenTriggered = true;
        this.state = 'frozen';
        this.ui.showHint('Tap the screen\nto jump!', 999);
        return;
      }
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.x + this.worldContainer.x + eW(e) < -200) {
        this._removeEntity(e); this.entities.splice(i, 1); continue;
      }
      e.update(dt);
      if (!e.active) continue;

      let hx = e.x, hy = e.y;
      const hw = (e as any).hitboxWidth  ?? eW(e);
      const hh = (e as any).hitboxHeight ?? eH(e);
      if ('hitboxOffsetX' in e) hx += (e as any).hitboxOffsetX;
      if ('hitboxOffsetY' in e) hy += (e as any).hitboxOffsetY;
      const hesx = hx + this.worldContainer.x;
      const px = this.player.x + this.player.width  * 0.15;
      const py = this.player.y + this.player.height * 0.20;
      const pw = this.player.width  * 0.70;
      const ph = this.player.height * 0.60;

      if (px+pw>hesx && px<hesx+hw && py+ph>hy && py<hy+hh) {
        if (e instanceof Coin) {
          this.balance += 45; this.coinsCollected++;
          this._spawnFlyingCoin(e.x + this.worldContainer.x + e.width/2, e.y + e.height/2);
          if (this.coinsCollected % 5 === 0) {
            const msgs = ['Awesome!', 'Keep going!', "You're rich!", 'Great!'];
            this._spawnMilestone(msgs[Math.floor(this.coinsCollected/5-1) % msgs.length]);
          }
          this._removeEntity(e); this.entities.splice(i, 1); continue;
        }
        if ((e instanceof Monster || e instanceof Obstacle) && this.player.canTakeDamage()) {
          this.player.takeDamage(); this.health -= 1; e.active = false;
          if (this.health <= 0) {
            this.state = 'lose'; this._stopMusic(); this._playLose(); this._showLoseScreen(); return;
          }
        }
      }
    }

    // Спавним строго за правым краем видимой игровой области
    const spawnX = this.distance + (this.LW - this.CAM) + 300;

    if (Math.random() < 0.028)
      this._addEntity(new Coin(spawnX + Math.random()*250, 440 + Math.random()*140));

    if (Math.random() < 0.032 && this.distance - this.lastDanger > 350 && this.entities.length < 35) {
      const obj = Math.random() < 0.65
        ? new Obstacle(spawnX)
        : new Monster(spawnX, this.robberTex);
      this._addEntity(obj);
      this.lastDanger = this.distance;
    }

    if (this.distance > this.finishX) {
      this.state = 'win'; this._stopMusic(); this._playWin(); this._showWinScreen();
    }

    for (let j = this.flyingCoins.length - 1; j >= 0; j--) {
      const c = this.flyingCoins[j]; c.progress += dt * 3.5;
      if (c.progress >= 1) {
        this.effectsContainer.removeChild(c.sprite); c.sprite.destroy(); this.flyingCoins.splice(j, 1); continue;
      }
      c.sprite.x += (c.tx - c.sprite.x) * 0.18;
      c.sprite.y += (c.ty - c.sprite.y) * 0.18;
      c.rotation += dt * 8; c.sprite.rotation = c.rotation;
      const ease = 1 - Math.pow(1 - c.progress, 3);
      c.sprite.alpha = Math.max(0.1, 1 - ease * 1.2);
      const sc = 1 - ease * 0.65; c.sprite.width = c.sprite.height = 44 * sc;
    }

    for (let j = this.floatingTexts.length - 1; j >= 0; j--) {
      const ft = this.floatingTexts[j]; ft.elapsed += dt;
      const p = ft.elapsed / ft.duration;
      ft.text.y += ft.vy * dt; ft.vy *= 0.96;
      ft.text.alpha = p < 0.15 ? p/0.15 : p > 0.70 ? 1-(p-0.70)/0.30 : 1;
      if (ft.elapsed >= ft.duration) {
        this.effectsContainer.removeChild(ft.text); ft.text.destroy(); this.floatingTexts.splice(j, 1);
      }
    }
  }

  private _buildWinScreen(): void {
    this.winScreen = new PIXI.Container(); this.winScreen.visible = false;
    this.overlayContainer.addChild(this.winScreen);
    const W = this.LW, H = this.LH;
    const bg = new PIXI.Graphics();
    bg.fill({ color:0x000000, alpha:0.80 }).rect(0, 0, W, H).fill();
    this.winScreen.addChild(bg);
    const t1 = mkText('Congratulations!', { fontFamily:'Arial', fontWeight:'bold', fontSize:54, fill:0xffd700 });
    t1.anchor.set(0.5, 0); t1.x = W/2; t1.y = 180; this.winScreen.addChild(t1);
    const t2 = mkText('Choose your reward!', { fontFamily:'Arial', fontWeight:'bold', fontSize:32, fill:0xffffff });
    t2.anchor.set(0.5, 0); t2.x = W/2; t2.y = 250; this.winScreen.addChild(t2);
    const card = new PIXI.Graphics();
    card.fill({ color:0xffffff }).roundRect(W/2-170, 308, 340, 200, 20).fill();
    this.winScreen.addChild(card);
    const pp = mkText('PayPal', { fontFamily:'Arial', fontWeight:'bold', fontSize:42, fill:0x003087 });
    pp.anchor.set(0.5, 0); pp.x = W/2; pp.y = 330; this.winScreen.addChild(pp);
    this.winBalText = mkText('$0', { fontFamily:'Arial', fontWeight:'bold', fontSize:56, fill:0x003087 });
    this.winBalText.anchor.set(0.5, 0); this.winBalText.x = W/2; this.winBalText.y = 392;
    this.winScreen.addChild(this.winBalText);
    this.winScreen.addChild(this._makeCTA('INSTALL AND EARN', 0xff9500, 548));
    this.confettiGfx = new PIXI.Graphics();
    this.winScreen.addChild(this.confettiGfx);
  }

  private _showWinScreen(): void {
    this.winBalText.text = `$${Math.floor(this.balance)}`; this.winScreen.visible = true;
    const colors = [0xFFCC00, 0x00A0FF, 0xFF4444, 0x00FF88];
    this.confettiData = Array.from({ length:120 }, (_, i) => ({
      x: Math.random()*this.LW, y: Math.random()*this.LH - 300,
      vx: Math.random()*6 - 3, vy: Math.random()*8 + 4,
      color: colors[i%4], size: Math.random()*12 + 6,
    }));
  }

  private _updateConfetti(): void {
    this.confettiGfx.clear();
    for (let i = this.confettiData.length - 1; i >= 0; i--) {
      const c = this.confettiData[i]; c.x += c.vx; c.y += c.vy; c.vy += 0.3;
      if (c.y > this.LH) { this.confettiData.splice(i, 1); continue; }
      this.confettiGfx.fill({ color:c.color }).rect(c.x, c.y, c.size, c.size*0.6).fill();
    }
  }

  private _buildLoseScreen(): void {
    this.loseScreen = new PIXI.Container(); this.loseScreen.visible = false;
    this.overlayContainer.addChild(this.loseScreen);
    const W = this.LW;
    const bg = new PIXI.Graphics();
    bg.fill({ color:0x000000, alpha:0.55 }).rect(0, 0, W, this.LH).fill();
    this.loseScreen.addChild(bg);
    const t1 = mkText("You didn't make it!", { fontFamily:'Arial', fontWeight:'bold', fontSize:48, fill:0xffffff });
    t1.anchor.set(0.5, 0); t1.x = W/2; t1.y = 200; this.loseScreen.addChild(t1);
    const t2 = mkText('Try again on the app!', { fontFamily:'Arial', fontWeight:'bold', fontSize:28, fill:0xffffff });
    t2.anchor.set(0.5, 0); t2.x = W/2; t2.y = 264; this.loseScreen.addChild(t2);
    const card = new PIXI.Graphics();
    card.fill({ color:0xffffff }).roundRect(W/2-175, 314, 350, 215, 26).fill();
    this.loseScreen.addChild(card);
    const pp = mkText('PayPal', { fontFamily:'Arial', fontWeight:'bold', fontSize:46, fill:0x003087 });
    pp.anchor.set(0.5, 0); pp.x = W/2; pp.y = 338; this.loseScreen.addChild(pp);
    this.losBalText = mkText('$0', { fontFamily:'Arial', fontWeight:'bold', fontSize:62, fill:0x003087 });
    this.losBalText.anchor.set(0.5, 0); this.losBalText.x = W/2; this.losBalText.y = 396;
    this.loseScreen.addChild(this.losBalText);
    this.loseScreen.addChild(this._makeCTA('INSTALL AND EARN', 0xff4444, 560));
  }

  private _showLoseScreen(): void {
    this.losBalText.text = `$${Math.floor(this.balance)}`; this.loseScreen.visible = true;
  }

  private _makeCTA(label: string, color: number, y: number): PIXI.Container {
    const btnW = 340, btnH = 76, c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.fill({ color }).roundRect(this.LW/2 - btnW/2, y, btnW, btnH, 40).fill();
    c.addChild(bg);
    const txt = mkText(label, { fontFamily:'Arial', fontWeight:'bold', fontSize:30, fill:0xffffff });
    txt.anchor.set(0.5, 0.5); txt.x = this.LW/2; txt.y = y + btnH/2;
    c.addChild(txt);
    return c;
  }
}