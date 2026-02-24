import { Application, Container } from 'pixi.js';

export class Game {
  private app: Application;
  private rootContainer: Container;

  constructor(app: Application) {
    this.app = app;
    this.rootContainer = new Container();
    this.app.stage.addChild(this.rootContainer);
  }

  async init() {
    console.log('🎮 Игра инициализирована');
    // Пока просто заглушка — дальше добавим игрока, фон и т.д.
  }

  update(deltaTime: number) {
    // Здесь будет обновление всех объектов (пока пусто)
  }
}