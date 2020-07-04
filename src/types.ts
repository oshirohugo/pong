export type Pos = {
  x: number;
  y: number;
};

export type Input = {
  playerId: number;
  pressTime: number;
  sequenceNumber: number;
};

export type GameState = {
  players: {
    id: number;
    pos: Pos;
    points: number;
    lastProcessedInput: number;
  }[];
  ball: Pos;
  speed: number;
  serverUpdateRate: number;
  lastPlayerId: number;
};
