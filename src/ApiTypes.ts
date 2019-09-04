export enum GameEvent {
  START = 'START',
  QUESTION = 'QUESTION',
  ROUND_END = 'ROUND_END',
  END = 'END',
  TEST = 'TEST'
}

export enum ClientEvent {
  HELLO = 'HELLO',
  ANSWER = 'ANSWER',
  BYE = 'BYE',
}

export interface Message {
  type: ClientEvent | GameEvent,
  value: any;
}