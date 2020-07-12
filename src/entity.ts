import { Rect } from 'konva/types/shapes/Rect';

import { Pos } from './types';

abstract class Entity {
  public node: Rect;
  public positionBuffer: {
    position: Pos;
    timestamp: number;
  }[] = [];

  public interpolate(serverUpdateRate: number) {
    const now = new Date().getTime();
    const renderTimestamp = now - 1000.0 / serverUpdateRate;

    const buffer = this.positionBuffer;

    while (buffer.length >= 2 && buffer[1].timestamp <= renderTimestamp) {
      buffer.shift();
    }

    if (buffer.length >= 2 && buffer[0].timestamp <= renderTimestamp) {
      const pos0 = buffer[0].position;
      const pos1 = buffer[1].position;
      const t0 = buffer[0].timestamp;
      const t1 = buffer[1].timestamp;

      const newX = pos0.x + ((pos1.x - pos0.x) * (renderTimestamp - t0)) / (t1 - t0);
      const newY = pos0.y + ((pos1.y - pos0.y) * (renderTimestamp - t0)) / (t1 - t0);

      this.setPos({ x: newX, y: newY });
    }
  }

  public abstract setPos(newPos: Pos): void;
}

export default Entity;
