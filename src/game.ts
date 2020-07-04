import Konva from 'konva';
import { Stage } from 'konva/types/Stage';
import { Layer } from 'konva/types/Layer';
import { Text } from 'konva/types/shapes/Text';

import Player from './player';
import Ball from './ball';
import { Rect } from 'konva/types/shapes/Rect';
import {
  INITIAL_SPEED,
  TEXT_COLOR,
  BACKGROUND_COLOR,
  LOOP_PERIOD,
  MAP_HEIGHT,
  MAP_WIDTH,
  CLIENT_SIDE_PREDICTION,
  RECONCILIATION,
  INTERPOLATION,
  PLAYER_COLOR,
  FPS,
} from './game-params';
import KeysListener from './keys-listener';
import { Pos, Input, GameState } from './types';
import Client from './client';
import Message from './message';

class Game {
  private stage: Stage;
  private layer: Layer;
  private title: Text;
  private scoreBoard: Text;
  private loading: Text;
  private shadowLayer: Rect;

  private gameStart: boolean = false;
  private speed: number;
  private control: { up: boolean; down: boolean } = { up: false, down: false };
  private pressTime: number;
  private inputSequenceNumber: number;
  private pendingInputs: Input[] = [];
  private onInput: (arg: any) => void;
  private serverUpdateRate = FPS;

  private player: Player;
  private ball: Ball;
  private players: (Player | undefined)[] = [undefined, undefined];
  private activePlayer = 0;

  constructor() {
    this.stage = new Konva.Stage({
      container: 'container',
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
    });

    this.layer = new Konva.Layer();

    const backGround = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: BACKGROUND_COLOR,
      stroke: PLAYER_COLOR,
      strokeWidth: 2,
    });

    this.shadowLayer = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      fill: BACKGROUND_COLOR,
      opacity: 0.7,
    });

    this.title = new Konva.Text({
      x: this.stage.width() / 2 - 60,
      y: 0,
      text: 'PONG',
      fontSize: 30,
      fontFamily: 'Orbitron',
      fill: TEXT_COLOR,
    });

    this.scoreBoard = new Konva.Text({
      x: this.stage.width() / 2 - 55,
      y: 30,
      text: '0 x 0',
      fontSize: 30,
      fontFamily: 'Orbitron',
      align: 'center',
      verticalAlign: 'middle',
      fill: TEXT_COLOR,
    });

    this.layer.add(backGround);
    this.gameOver();
    this.stage.add(this.layer);
    this.startKeyListener();
  }

  private startKeyListener() {
    const keyListener = new KeysListener({
      onDown: this.onDown.bind(this),
      onUp: this.onUp.bind(this),
    });
    keyListener.listen();
  }

  private onUp(eventType: string) {
    this.control.up = eventType === 'keydown';
  }

  private onDown(eventType: string) {
    this.control.down = eventType === 'keydown';
  }

  private gameOver() {
    if (this.player) {
      this.player.die();
    }
    this.gameStart = false;
    this.layer.add(this.title);
    this.layer.add(this.scoreBoard);
  }

  private processInput(elapsed: number) {
    // return if no input

    if (!this.control.down && !this.control.up) {
      return;
    }

    let pressTime = elapsed;
    if (this.control.up) {
      pressTime *= -1;
    }

    if (CLIENT_SIDE_PREDICTION) {
      this.player.applyInput(pressTime);
    }

    const input: Input = {
      pressTime,
      playerId: this.player.id,
      sequenceNumber: new Date().getTime(),
    };

    this.onInput(input);

    this.pendingInputs.push(input);
  }

  public setOnInput(cb: any) {
    this.onInput = cb;
  }

  public onStart(msg: GameState) {
    if (!this.gameStart) {
      this.gameStart = true;

      if (this.player) {
        this.player.destroy();
      }

      if (this.ball) {
        this.ball.destroy();
      }

      const {
        players: remotePlayers,
        lastPlayerId,
        ball: remoteBall,
        speed,
        serverUpdateRate,
      } = msg;

      this.player = new Player(remotePlayers[lastPlayerId].id, remotePlayers[lastPlayerId].pos);
      this.players[this.player.id] = this.player;

      this.layer.add(this.player.node);

      this.ball = new Ball(remoteBall);

      this.layer.add(this.ball.node);

      this.layer.add(this.shadowLayer);

      if (remotePlayers.length > 1) {
        this.shadowLayer.hide();
      }

      this.serverUpdateRate = serverUpdateRate;
    }
  }

  public onGameUpdate(message: GameState) {
    const { players: remotePlayers, ball: remoteBall } = message;

    if (remotePlayers.length > 1) {
      this.shadowLayer.hide();
    } else {
      this.shadowLayer.show();
      if (this.activePlayer === 2) {
        const existingId = remotePlayers[0].id;
        const removeIndex = existingId === 1 ? 0 : 1;
        this.players[removeIndex]?.node.remove();
        this.players[removeIndex] = undefined;
        this.activePlayer--;
      }
    }

    if (!INTERPOLATION) {
      this.ball.setPos(remoteBall);
    } else {
      const timestamp = +new Date();
      this.ball.positionBuffer.push({ timestamp, position: remoteBall });
    }

    for (const remotePlayer of remotePlayers) {
      if (!this.players[remotePlayer.id]) {
        const newPlayer = new Player(remotePlayer.id, remotePlayer.pos);
        this.players[newPlayer.id] = newPlayer;
        this.layer.add(newPlayer.node);
        this.activePlayer++;
      }

      const currentPlayer = this.players[remotePlayer.id];
      if (currentPlayer) {
        currentPlayer.points = remotePlayer.points;

        if (currentPlayer.id === this.player.id) {
          currentPlayer.setPos(remotePlayer.pos);

          if (RECONCILIATION) {
            let j = 0;
            while (j < this.pendingInputs.length) {
              const input = this.pendingInputs[j];

              if (input.sequenceNumber <= remotePlayer.lastProcessedInput) {
                this.pendingInputs.splice(j, 1);
              } else {
                currentPlayer.applyInput(input.pressTime);
                j++;
              }
            }
          }
        } else {
          if (!INTERPOLATION) {
            currentPlayer.setPos(remotePlayer.pos);
          } else {
            const timestamp = +new Date();
            currentPlayer.positionBuffer.push({ timestamp, position: remotePlayer.pos });
          }
        }
      }
    }
  }

  private interPolate() {
    const now = new Date().getTime();
    const renderTimestamp = now - 1000.0 / this.serverUpdateRate;
    for (const player of this.players) {
      if (!player || player.id === this.player.id) {
        continue;
      }

      const buffer = player.positionBuffer;

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

        player.setPos({ x: newX, y: newY });
      }
    }

    const buffer = this.ball.positionBuffer;

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

      this.ball.setPos({ x: newX, y: newY });
    }
  }

  public run() {
    let lastRender = 0;
    const anim = new Konva.Animation((frame) => {
      if (frame) {
        const elapsedTime = (frame.time - lastRender) / 1000;
        if (elapsedTime > LOOP_PERIOD) {
          lastRender = frame.time;

          if (this.gameStart) {
            this.processInput(elapsedTime);

            this.interPolate();

            const points0 = this.players[0] ? this.players[0].points : 0;
            const points1 = this.players[1] ? this.players[1].points : 0;
            this.scoreBoard.text(`${Math.round(points0)} x ${Math.round(points1)}`);
          }
        }
      }
    }, this.layer);

    anim.start();
  }
}

export default Game;
