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

export interface Message<T> {
  sender: string;
  content: T;
}


export type GameQuestionMessage = MessageContent<{
  to: string,
  question: string,
  players: Client[]
}>

export type GameStartMessage = MessageContent<Client[]>

export type GameRoundEndMessage = MessageContent<Answer>

export type GameEndMessage = MessageContent<Answer[]>

export interface MessageContent<V> {
  type: ClientEvent | GameEvent;
  value: V;
}

export type ClientHelloMessage = MessageContent<string>;

export type ClientAnswerMessage = MessageContent<{
  clientId: string
}>

export interface Client {
  clientId: string;
  name: string;
}

export interface Answer {
  clientId: string,
  question: string
}