import { Rect } from 'konva/types/shapes/Rect';
import Konva from 'konva';

import { BALL_COLOR } from './game-params';
import { Pos } from './types';

class Ball {
  node: Rect;
  static width: number = 20;
  static height: number = 20;
  fill: string;
  limits: Pos;
  public positionBuffer: any[] = [];

  constructor(start: Pos) {
    this.node = new Konva.Rect({
      x: start.x,
      y: start.y,
      width: 10,
      height: 10,
      fill: BALL_COLOR,
    });
  }

  public get x() {
    return this.node.x();
  }

  public get y() {
    return this.node.y();
  }

  public setPos(newPos: Pos) {
    this.node.x(newPos.x);
    this.node.y(newPos.y);
  }

  public destroy() {
    this.node.remove();
  }
}

export default Ball;
