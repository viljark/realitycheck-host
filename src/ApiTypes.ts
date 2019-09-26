export enum GameEvent {
  START = 'START',
  QUESTION = 'QUESTION',
  ROUND_END = 'ROUND_END',
  CLIENT_JOINED = 'CLIENT_JOINED',
  CLIENT_LEFT = 'CLIENT_LEFT',
  END = 'END',
  TEST = 'TEST'
}

export enum ClientEvent {
  HELLO = 'HELLO',
  START_GAME = 'START_GAME',
  ANSWER = 'ANSWER',
  BYE = 'BYE',
}

export interface Message<T> {
  sender: string;
  content: T;
}

export interface Question {
  to: string,
  question: string,
  players: Client[]
}

export type GameQuestionMessage = MessageContent<Question>

export type GameStartMessage = MessageContent<Client[]>

export type GameRoundEndMessage = MessageContent<Answer>

export type GameEndMessage = MessageContent<Answer[]>

export type GameClientJoinedMessage = MessageContent<Client[]>

export type GameClientLeftMessage = MessageContent<Client[]>

export interface MessageContent<V> {
  type: ClientEvent | GameEvent;
  value: V;
}

export type ClientHelloMessage = MessageContent<string>;

export type ClientByeMessage = MessageContent<string>;

export type ClientAnswerMessage = MessageContent<{
  clientId: string
}>

export type ClientStartGameMessage = MessageContent<any>;

export interface Client {
  clientId: string;
  name: string;
  vip?: boolean;
}

export interface Answer {
  clientId: string,
  question: string,
  name: string,
}