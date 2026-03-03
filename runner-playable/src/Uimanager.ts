import * as PIXI from 'pixi.js';
import healthPng from './assets/health.png';
import moneyPng  from './assets/money.png';

function mkText(text: string, style: Record<string, any>): PIXI.Text {
  return new PIXI.Text({ text, style });
}

export class UIManager {
  public readonly container: PIXI.Container;

  private hearts:          PIXI.Sprite[] = [];
  private heartBaseScaleX: number[]      = [];
  private heartBaseScaleY: number[]      = [];

  private cardBg!:      PIXI.Graphics;
  private balanceText!: PIXI.Text;
  private ppLogoCard!:  PIXI.Graphics;

  private bottomBg!:   PIXI.Graphics;
  private playoffTxt!: PIXI.Text;
  private coinA!:      PIXI.Sprite;
  private coinB!:      PIXI.Sprite;
  private ppBoxBg!:    PIXI.Graphics;
  private ppBoxTxt!:   PIXI.Text;
  private dlBg!:       PIXI.Graphics;
  private dlTxt!:      PIXI.Text;

  private hintText!:  PIXI.Text;
  private hintTimer   = 0;

  // Кэш центра карточки баланса в экранных пикселях
  private _cardCX = 0;
  private _cardCY = 0;

  private sw = 640;
  private sh = 960;

  constructor() {
    this.container = new PIXI.Container();
  }

  init(): void {
    this._buildHearts();
    this._buildBalanceCard();
    this._buildBottomBar();
    this._buildHint();
  }

  /**
   * Центр карточки баланса в ЭКРАННЫХ пикселях.
   * Game.ts использует это для точного прицеливания летящих монеток
   * при любом размере экрана — без хардкода.
   */
  getBalanceCardCenter(): { x: number; y: number } {
    return { x: this._cardCX, y: this._cardCY };
  }

  layout(sw: number, sh: number): void {
    this.sw = sw;
    this.sh = sh;

    const PAD = 14;

    // ── Hearts: top-left ──────────────────────────────────────────────────
    const hSize = Math.round(Math.min(sw, sh) * 0.055);
    this.hearts.forEach((h, i) => {
      h.width  = hSize;
      h.height = Math.round(hSize * 0.85);
      h.x = PAD + i * (hSize + 8);
      h.y = PAD;
      this.heartBaseScaleX[i] = h.scale.x;
      this.heartBaseScaleY[i] = h.scale.y;
    });

    // ── Balance card: top-right ───────────────────────────────────────────
    const cardH = Math.round(sh * 0.065);
    const cardW = Math.round(sw * 0.28);
    const cardX = sw - cardW - PAD;
    const cardY = PAD;
    const cardR = cardH / 2;

    // Кэшируем центр карточки — используется в getBalanceCardCenter()
    this._cardCX = cardX + cardW * 0.62;
    this._cardCY = cardY + cardH * 0.5;

    this.cardBg.clear();
    this.cardBg
      .fill({ color: 0xffffff, alpha: 0.96 })
      .roundRect(cardX, cardY, cardW, cardH, cardR)
      .fill()
      .setStrokeStyle({ width: 1.5, color: 0x0079c1, alpha: 0.3 })
      .roundRect(cardX, cardY, cardW, cardH, cardR)
      .stroke();

    const logoR = cardH * 0.28;
    this.ppLogoCard.clear();
    this.ppLogoCard
      .fill({ color: 0x009cde }).circle(cardX + logoR + 10, cardY + cardH / 2, logoR).fill()
      .fill({ color: 0x003087 }).circle(cardX + logoR + 15, cardY + cardH / 2 + logoR * 0.3, logoR * 0.85).fill();

    this.balanceText.style.fontSize = Math.round(cardH * 0.52);
    this.balanceText.anchor.set(0.5, 0.5);
    this.balanceText.x = this._cardCX;
    this.balanceText.y = cardY + cardH * 0.58;

    // ── Bottom bar: bottom anchor ─────────────────────────────────────────
    const barH = Math.round(sh * 0.1);
    const barY = sh - barH;

    this.bottomBg.clear();
    this.bottomBg
      .fill({ color: 0x6d28d9 }).rect(0, barY, sw, barH).fill()
      .fill({ color: 0x4c1d95, alpha: 0.5 }).rect(0, barY + barH * 0.5, sw, barH * 0.5).fill();

    const midY = barY + barH / 2;
    const fs   = Math.round(barH * 0.42);

    this.playoffTxt.style.fontSize = fs;
    this.playoffTxt.anchor.set(0, 0.5);
    this.playoffTxt.x = PAD + 6;
    this.playoffTxt.y = midY;

    const pW = this.playoffTxt.width;
    const cS = Math.round(barH * 0.44);
    if (this.coinA) { this.coinA.width = this.coinA.height = cS;       this.coinA.x = PAD + 6 + pW + 4;       this.coinA.y = midY - cS * 0.6; }
    if (this.coinB) { this.coinB.width = this.coinB.height = cS * 0.8; this.coinB.x = PAD + 6 + pW + cS + 2; this.coinB.y = midY - cS * 0.3; }

    const ppW = Math.round(sw * 0.22);
    const ppH = Math.round(barH * 0.64);
    const ppX = sw / 2 - ppW / 2;
    const ppY = midY - ppH / 2;
    this.ppBoxBg.clear();
    this.ppBoxBg
      .fill({ color: 0xffffff, alpha: 0.92 })
      .roundRect(ppX, ppY, ppW, ppH, ppH / 2)
      .fill();
    this.ppBoxTxt.style.fontSize = Math.round(ppH * 0.42);
    this.ppBoxTxt.anchor.set(0.5, 0.5);
    this.ppBoxTxt.x = sw / 2;
    this.ppBoxTxt.y = midY;

    const dlW = Math.round(sw * 0.28);
    const dlH = Math.round(barH * 0.72);
    const dlX = sw - dlW - PAD;
    const dlY = midY - dlH / 2;
    this.dlBg.clear();
    this.dlBg
      .fill({ color: 0xff9500 })
      .roundRect(dlX, dlY, dlW, dlH, dlH / 2)
      .fill();
    this.dlTxt.style.fontSize = Math.round(dlH * 0.38);
    this.dlTxt.anchor.set(0.5, 0.5);
    this.dlTxt.x = dlX + dlW / 2;
    this.dlTxt.y = midY;

    // ── Hint: по центру игровой зоны ─────────────────────────────────────
    this.hintText.x = sw / 2;
    this.hintText.y = barY * 0.43;
    this.hintText.style.fontSize = Math.round(Math.min(sw, sh) * 0.05);
    (this.hintText.style as any).wordWrapWidth = sw * 0.7;
  }

  update(health: number, balance: number, dt: number): void {
    const t = performance.now();
    this.hearts.forEach((h, i) => {
      const alive = i < health;
      h.alpha = alive ? 1 : 0.25;
      const bx = this.heartBaseScaleX[i] ?? h.scale.x;
      const by = this.heartBaseScaleY[i] ?? h.scale.y;
      const p  = alive ? 1 + Math.sin(t * 0.003 + i * 1.2) * 0.06 : 1;
      h.scale.set(bx * p, by * p);
    });
    this.balanceText.text = `$${balance}`;

    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      this.hintText.alpha = this.hintTimer < 0.4 ? this.hintTimer / 0.4 : 1;
      if (this.hintTimer <= 0) { this.hintText.visible = false; this.hintTimer = 0; }
    }
  }

  showHint(text: string, duration = 2.5): void {
    this.hintText.text    = text;
    this.hintText.visible = true;
    this.hintText.alpha   = 1;
    this.hintTimer        = duration;
  }

  hideHint(): void { this.hintText.visible = false; this.hintTimer = 0; }

  getBarHeight(): number { return Math.round(this.sh * 0.1); }

  private _buildHearts(): void {
    const tex = PIXI.Texture.from(healthPng);
    for (let i = 0; i < 3; i++) {
      const h = new PIXI.Sprite(tex);
      h.width = 52; h.height = 46;
      this.heartBaseScaleX.push(h.scale.x);
      this.heartBaseScaleY.push(h.scale.y);
      this.hearts.push(h);
      this.container.addChild(h);
    }
  }

  private _buildBalanceCard(): void {
    this.cardBg      = new PIXI.Graphics();
    this.ppLogoCard  = new PIXI.Graphics();
    this.balanceText = mkText('$0', {
      fontFamily: 'Arial', fontWeight: 'bold', fontSize: 26, fill: 0x003087,
    });
    this.container.addChild(this.cardBg, this.ppLogoCard, this.balanceText);
  }

  private _buildBottomBar(): void {
    this.bottomBg   = new PIXI.Graphics();
    this.playoffTxt = mkText('Playoff', { fontFamily:'Arial', fontWeight:'bold', fontSize:36, fill:0xffffff });
    this.coinA      = new PIXI.Sprite(PIXI.Texture.from(moneyPng));
    this.coinB      = new PIXI.Sprite(PIXI.Texture.from(moneyPng));
    this.ppBoxBg    = new PIXI.Graphics();
    this.ppBoxTxt   = mkText('PayPal',   { fontFamily:'Arial', fontWeight:'bold', fontSize:16, fill:0x003087 });
    this.dlBg       = new PIXI.Graphics();
    this.dlTxt      = mkText('DOWNLOAD', { fontFamily:'Arial', fontWeight:'bold', fontSize:18, fill:0xffffff });

    this.container.addChild(
      this.bottomBg,
      this.playoffTxt, this.coinA, this.coinB,
      this.ppBoxBg, this.ppBoxTxt,
      this.dlBg, this.dlTxt,
    );
  }

  private _buildHint(): void {
    this.hintText = mkText('', {
      fontFamily: 'Arial', fontWeight: 'bold', fontSize: 40,
      fill: 0xffffff,
      dropShadow: true, dropShadowColor: 0x000000,
      dropShadowBlur: 14, dropShadowDistance: 3,
      align: 'center', wordWrap: true, wordWrapWidth: 400,
    });
    this.hintText.anchor.set(0.5, 0.5);
    this.hintText.visible = false;
    this.container.addChild(this.hintText);
  }
}