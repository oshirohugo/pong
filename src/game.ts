import Konva from 'konva';
import { Stage } from 'konva/types/Stage';
import { Layer } from 'konva/types/Layer';
import { Text } from 'konva/types/shapes/Text';

import Player from './player';
import Ball from './ball';
import { Rect } from 'konva/types/shapes/Rect';
import {
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
import { Input, GameState } from './types';
import oscillator from './oscilattor';

class Game {
  private stage: Stage;
  private layer: Layer;
  private title: Text;
  private scoreBoard: Text;
  private waiting: Text;
  private shadowLayer: Rect;

  private gameStart: boolean = false;
  private control: { up: boolean; down: boolean } = { up: false, down: false };
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

    this.waiting = new Konva.Text({
      x: this.stage.width() / 2 - 120,
      y: this.stage.height() / 2,
      text: 'Waiting for opponent',
      fontSize: 20,
      fontFamily: 'Orbitron',
      fill: TEXT_COLOR,
    });

    this.layer.add(backGround);
    this.layer.add(this.title);
    this.layer.add(this.scoreBoard);

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

      const { players: remotePlayers, lastPlayerId, ball: remoteBall, serverUpdateRate } = msg;

      this.player = new Player(remotePlayers[lastPlayerId].id, remotePlayers[lastPlayerId].pos);
      this.players[this.player.id] = this.player;
      this.activePlayer++;
      this.ball = new Ball(remoteBall);

      // add elements to the layer to be rendered
      this.layer.add(this.player.node);
      this.layer.add(this.ball.node);

      // show shadow loayer to indicate that the game didn't start yet
      this.layer.add(this.shadowLayer);
      this.layer.add(this.waiting);

      if (remotePlayers.length > 1) {
        this.shadowLayer.hide();
        this.waiting.hide();
      }

      this.serverUpdateRate = serverUpdateRate;
    }
  }

  public onGameUpdate(message: GameState) {
    const { players: remotePlayers, ball: remoteBall } = message;

    if (remotePlayers.length > 1) {
      // hide shadow layer if a game match was done
      this.shadowLayer.hide();
      this.waiting.hide();
    } else {
      this.shadowLayer.show();
      this.waiting.show();
      // if a player disconnection was detect remove the player
      if (this.activePlayer === 2) {
        const existingId = remotePlayers[0].id;
        const removeIndex = existingId === 1 ? 0 : 1;
        this.players[removeIndex]?.destroy();
        this.players[removeIndex] = undefined;
        this.activePlayer--;
      }
    }

    // deal with ball position update
    if (!INTERPOLATION) {
      this.ball.setPos(remoteBall);
    } else {
      const timestamp = +new Date();
      this.ball.positionBuffer.push({ timestamp, position: remoteBall });
    }

    // deal with player position updated
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
    for (const player of this.players) {
      if (!player || player.id === this.player.id) {
        continue;
      }
      player.interpolate(this.serverUpdateRate);
    }
    this.ball.interpolate(this.serverUpdateRate);
  }

  private getOscillateOpacity(time: number) {
    const offset = 1.5;
    const correction = 0.5;
    return oscillator(time, 7e-4, 1, 0, offset) * correction;
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
          this.waiting.opacity(this.getOscillateOpacity(frame.time));
        }
      }
    }, this.layer);

    anim.start();
  }
}

export default Game;
