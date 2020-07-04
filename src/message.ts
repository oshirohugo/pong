export type MessageType = 'START' | 'GAME_STATE' | 'CONTROL';

class Message {
  constructor(public type: MessageType, public body: any) {}

  public toJSON(): any {
    return {
      type: this.type,
      body: this.body,
    };
  }

  static parse(rawMessage: string) {
    const message = JSON.parse(rawMessage);
    return new Message(message.type, message.body);
  }

  public stringify(): string {
    return JSON.stringify(this);
  }
}

export default Message;
