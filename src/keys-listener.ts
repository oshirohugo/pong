export type ControllerParams = {
  onUp: (eventType: string) => void;
  onDown: (eventType: string) => void;
};

class KeysListener {
  constructor(private callBacks: ControllerParams) {}

  listen() {
    const keyHandler = (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case 38: // up
          this.callBacks.onUp(e.type);
          break;
        case 40: // down
          this.callBacks.onDown(e.type);
          break;
      }
      e.preventDefault();
    };

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyHandler);
  }
}

export default KeysListener;
