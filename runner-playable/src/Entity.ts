// Base entity interface — used for type-safe collision detection in Game.ts
export interface IEntity {
  x:      number;
  y:      number;
  width:  number;
  height: number;
  active: boolean;
  update(dt: number): void;
}