import Konva from 'konva';

import { PLAYER_SPEED, PLAYER_COLOR, PLAYER_WIDTH, MAP_HEIGHT, PLAYER_HEIGHT } from './game-params';
import { Pos } from './types';
import Entity from './entity';

class Player extends Entity {
  public id: number;
  public positionBuffer: any[] = [];
  public points: number;

  constructor(id: number, start: Pos) {
    super();
    this.node = new Konva.Rect({
      x: start.x,
      y: start.y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      fill: PLAYER_COLOR,
    });
    this.id = id;
  }

  public setPos(newPos: Pos) {
    this.node.y(newPos.y);
  }

  public applyInput(pressTime: number) {
    const newPos = this.node.y() + pressTime * PLAYER_SPEED;
    if (newPos <= MAP_HEIGHT - 60 && newPos >= 0) {
      this.node.y(newPos);
    }
  }

  public destroy() {
    this.node.remove();
  }
}

export default Player;
