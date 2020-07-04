import { Rect } from 'konva/types/shapes/Rect';
import Konva from 'konva';

import { PLAYER_SPEED, PLAYER_COLOR, MAP_HEIGHT } from './game-params';
import { Pos } from './types';

class Player {
  public node: Rect;
  public live: boolean = true;
  public id: number;
  public positionBuffer: any[] = [];
  public points: number;

  constructor(id: number, start: Pos) {
    this.node = new Konva.Rect({
      x: start.x,
      y: start.y,
      width: 10,
      height: 60,
      fill: PLAYER_COLOR,
    });
    this.id = id;
  }

  public get x() {
    return this.node.x();
  }

  public get y() {
    return this.node.y();
  }

  public setPos(newPos: Pos) {
    this.node.y(newPos.y);
  }

  public applyInput(pressTime: number) {
    const newPos = this.y + pressTime * PLAYER_SPEED;
    if (newPos <= MAP_HEIGHT - 60 && newPos >= 0) {
      this.node.y(newPos);
    }
  }

  public die() {
    this.live = false;
  }

  public destroy() {
    this.node.remove();
  }
}

export default Player;
