import Konva from 'konva';

import { BALL_COLOR, BALL_SZ } from './game-params';
import { Pos } from './types';
import Entity from './entity';

class Ball extends Entity {
  fill: string;
  limits: Pos;

  constructor(start: Pos) {
    super();
    this.node = new Konva.Rect({
      x: start.x,
      y: start.y,
      width: BALL_SZ,
      height: BALL_SZ,
      fill: BALL_COLOR,
    });
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
