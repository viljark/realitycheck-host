import React from 'react';

import PubNub from 'pubnub';

import './App.css';
import { ClientByeMessage, ClientEvent, ClientHelloMessage, MessageContent } from './ApiTypes';

export interface AppProps {
  channelId: string;
  name: string;
}

export interface State {
  message: string;
  events: any[];
}


export class Game extends React.Component<AppProps, State> {
  private pubnub: PubNub;
  private uuid: string;
  constructor(props: AppProps) {
    super(props);
    this.uuid = PubNub.generateUUID();
    console.log('uuid', this.uuid);
    this.pubnub = new PubNub({
      publishKey: "pub-c-bd289ae2-d65d-4100-8ddd-a514558bbf7a",
      subscribeKey: "sub-c-51d1abbe-ce3b-11e9-9b51-8ae91c2a8a9f",
      uuid: this.uuid
    });
    this.state = {
      message: '',
      events: [],
    }
  }

  componentDidMount() {
    this.pubnub.subscribe({
      channels: [this.props.channelId],
      withPresence: true
    });

    this.pubnub.addListener({
      message: function(event) {
        console.log('got message', event);
      },
      presence: function(event) {
        console.log('got presence', event);
      }
    });
  }
  componentWillUnmount() {
    this.pubnub.unsubscribeAll();
  }

  send = (message: MessageContent<any>) => {
    this.pubnub.publish({
      channel: this.props.channelId,
      message: {
        sender: this.uuid,
        content: message,
      },
    }, (status, response) => {
      //Handle error here
    });
  };


  handleHello = () => {
    const hello: ClientHelloMessage = {
      type: ClientEvent.HELLO,
      value: this.props.name,
    };
    this.send(hello);
  }

  handleStart = () => {
    const hello: ClientHelloMessage = {
      type: ClientEvent.START_GAME,
      value: '',
    };
    this.send(hello);
  }

  handleBye = () => {
    const bye: ClientByeMessage = {
      type: ClientEvent.BYE,
      value: '',
    };
    this.send(bye);
  }

  render() {
    return (
      <div>
        <button onClick={this.handleHello}>Hello</button>
        <button onClick={this.handleBye}>Bye</button>
        <button onClick={this.handleStart}>Start game</button>
      </div>
    );
  }
}


export default Game;
