import * as PIXI from 'pixi.js';
import healthPng from './assets/health.png';
import moneyPng  from './assets/money.png';
import paypalPng from './assets/PayPal.png';

function mkText(text: string, style: Record<string, any>): PIXI.Text {
  return new PIXI.Text({ text, style });
}

export class UIManager {
  public readonly container: PIXI.Container;

  private hearts:          PIXI.Sprite[] = [];
  private heartBaseScaleX: number[]      = [];
  private heartBaseScaleY: number[]      = [];

  // Balance card — PayPal.png + текст поверх
  private ppCardSprite!: PIXI.Sprite;
  private balanceText!:  PIXI.Text;

  // Bottom bar
  private bottomBg!:      PIXI.Graphics;
  private playoffTxt!:    PIXI.Text;
  private moneyDecor!:    PIXI.Sprite;   // стопка денег рядом с "Playoff"
  private ppDecor!:       PIXI.Sprite;   // карточка PayPal рядом с деньгами
  private dlBg!:          PIXI.Graphics;
  private dlTxt!:         PIXI.Text;

  private hintText!: PIXI.Text;
  private hintTimer  = 0;

  private _cardCX = 0;
  private _cardCY = 0;

  private sw = 640;
  private sh = 960;

  constructor() { this.container = new PIXI.Container(); }

  init(): void {
    this._buildHearts();
    this._buildBalanceCard();
    this._buildBottomBar();
    this._buildHint();
  }

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

    // ── Balance card: top-right — PayPal.png ──────────────────────────────
    const cardH  = Math.round(sh * 0.065);
    const ppTex  = this.ppCardSprite.texture;
    const cardW  = Math.round(cardH * ppTex.width / ppTex.height);
    const cardX  = sw - cardW - PAD;
    const cardY  = PAD;

    this.ppCardSprite.x      = cardX;
    this.ppCardSprite.y      = cardY;
    this.ppCardSprite.width  = cardW;
    this.ppCardSprite.height = cardH;

    this._cardCX = cardX + cardW * 0.81;
    this._cardCY = cardY + cardH * 0.5;

    this.balanceText.style.fontSize = Math.round(cardH * 0.50);
    this.balanceText.anchor.set(0.5, 0.5);
    this.balanceText.x = this._cardCX;
    this.balanceText.y = cardY + cardH * 0.52;

    // ── Bottom bar ────────────────────────────────────────────────────────
    const barH   = Math.round(sh * 0.1);
    const barY   = sh - barH;
    const barR   = barH * 0.35;
    const barPad = 6;

    this.bottomBg.clear();

    // Основной фон
    this.bottomBg
      .fill({ color: 0x7c3aed })
      .roundRect(barPad, barY - barPad, sw - barPad * 2, barH + barPad, barR)
      .fill();

    // Затемнение нижней части
    this.bottomBg
      .fill({ color: 0x4c1d95, alpha: 0.55 })
      .roundRect(barPad, barY + barH * 0.35, sw - barPad * 2, barH * 0.65, barR)
      .fill();

    // Светлая обводка
    this.bottomBg
      .setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.20 })
      .roundRect(barPad, barY - barPad, sw - barPad * 2, barH + barPad, barR)
      .stroke();

    const midY = barY + barH / 2;
    const fs   = Math.round(barH * 0.44);

    // "Playoff" — жирный белый текст слева
    this.playoffTxt.style.fontSize = fs;
    this.playoffTxt.anchor.set(0, 0.5);
    this.playoffTxt.x = PAD + barPad + 8;
    this.playoffTxt.y = midY;

    // Стопка денег сразу после "Playoff"
    const pW  = this.playoffTxt.width;
    const mH  = Math.round(barH * 0.80);  // высота картинки денег
    const mW  = mH;                        // квадратная
    this.moneyDecor.width  = mW;
    this.moneyDecor.height = mH;
    this.moneyDecor.x = PAD + barPad + 8 + pW + 2;
    this.moneyDecor.y = midY - mH * 0.5;

    // PayPal карточка поверх / рядом с деньгами
    const ppH = Math.round(barH * 0.55);
    const ppDecorTex = this.ppDecor.texture;
    const ppW = Math.round(ppH * ppDecorTex.width / ppDecorTex.height);
    this.ppDecor.width  = ppW;
    this.ppDecor.height = ppH;
    this.ppDecor.x = PAD + barPad + 8 + pW + mW * 0.55; // перекрывает деньги
    this.ppDecor.y = midY - ppH * 0.65;

    // ── DOWNLOAD button — справа ──────────────────────────────────────────
    const dlW = Math.round(sw * 0.26);
    const dlH = Math.round(barH * 0.70);
    const dlX = sw - dlW - PAD - barPad;
    const dlY = midY - dlH / 2;

    this.dlBg.clear();

    // Жёлто-оранжевый градиент через два прямоугольника
    this.dlBg
      .fill({ color: 0xffa500 })
      .roundRect(dlX, dlY, dlW, dlH, dlH / 2)
      .fill();

    // Светлее сверху
    this.dlBg
      .fill({ color: 0xffcc00, alpha: 0.5 })
      .roundRect(dlX, dlY, dlW, dlH * 0.5, dlH / 2)
      .fill();

    // Тёмная обводка
    this.dlBg
      .setStrokeStyle({ width: 2, color: 0xcc6600, alpha: 0.6 })
      .roundRect(dlX, dlY, dlW, dlH, dlH / 2)
      .stroke();

    this.dlTxt.style.fontSize = Math.round(dlH * 0.40);
    this.dlTxt.anchor.set(0.5, 0.5);
    this.dlTxt.x = dlX + dlW / 2;
    this.dlTxt.y = midY;

    // ── Hint ──────────────────────────────────────────────────────────────
    this.hintText.x = sw / 2;
    this.hintText.y = (barY - barPad) * 0.43;
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

  // ── Builders ──────────────────────────────────────────────────────────────
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
    this.ppCardSprite = new PIXI.Sprite(PIXI.Texture.from(paypalPng));
    this.container.addChild(this.ppCardSprite);

    this.balanceText = mkText('$0', {
      fontFamily: 'Arial', fontWeight: 'bold', fontSize: 26, fill: 0xffffff,
      dropShadow: true, dropShadowColor: 0x00205b, dropShadowBlur: 4, dropShadowDistance: 1,
    });
    this.container.addChild(this.balanceText);
  }

  private _buildBottomBar(): void {
    this.bottomBg   = new PIXI.Graphics();

    // "Playoff" текст
    this.playoffTxt = mkText('Playoff', {
      fontFamily: 'Arial', fontWeight: 'bold', fontSize: 36, fill: 0xffffff,
      dropShadow: true, dropShadowColor: 0x000000, dropShadowBlur: 6, dropShadowDistance: 2,
    });

    // Стопка денег (money.png)
    this.moneyDecor = new PIXI.Sprite(PIXI.Texture.from(moneyPng));

    // PayPal карточка (PayPal.png) — декоративная в баре
    this.ppDecor = new PIXI.Sprite(PIXI.Texture.from(paypalPng));

    // Кнопка DOWNLOAD
    this.dlBg  = new PIXI.Graphics();
    this.dlTxt = mkText('DOWNLOAD', {
      fontFamily: 'Arial', fontWeight: 'bold', fontSize: 18, fill: 0xffffff,
      dropShadow: true, dropShadowColor: 0x663300, dropShadowBlur: 3, dropShadowDistance: 1,
    });

    this.container.addChild(
      this.bottomBg,
      this.playoffTxt,
      this.moneyDecor,
      this.ppDecor,
      this.dlBg,
      this.dlTxt,
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