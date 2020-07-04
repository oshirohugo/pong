export type ControllerParams = {
  onEnter: () => void;
  onUp: () => void;
  onDown: () => void;
};

class MenuKeysListener {
  private eventCallback: (e: KeyboardEvent) => void;

  constructor(private callBacks: ControllerParams) {}

  listen() {
    this.eventCallback = (e) => {
      switch (e.keyCode) {
        case 13: // s
          this.callBacks.onEnter();
          break;
        case 38: // up
          this.callBacks.onUp();
          break;
        case 40: // down
          this.callBacks.onDown();
          break;
      }
      e.preventDefault();
    };

    document.addEventListener('keydown', this.eventCallback);
  }

  public stopListen() {
    document.removeEventListener('keydown', this.eventCallback);
  }
}

export default MenuKeysListener;
