import Message from './message';
import { GameState } from './types';

type ClientParams = {
  onStart: (msg: GameState) => void;
  onGameUpdate: (msg: GameState) => void;
};

class Client {
  private ws: WebSocket;
  private callBacks: ClientParams;

  constructor(serverHost: string, callbacks: ClientParams) {
    this.ws = new WebSocket(serverHost);
    this.callBacks = callbacks;

    this.ws.onmessage = (ev) => {
      const msg = Message.parse(ev.data);

      switch (msg.type) {
        case 'START':
          this.callBacks.onStart(msg.body);
          break;
        case 'GAME_STATE':
          this.callBacks.onGameUpdate(msg.body);
          break;
      }
    };
  }

  public sendState(state: any) {
    const msg = new Message('CONTROL', state);
    this.ws.send(msg.stringify());
  }
}

export default Client;
