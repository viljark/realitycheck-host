import React from 'react';

import PubNub from 'pubnub';

import './App.css';
import { ClientEvent, Message } from './ApiTypes';

export interface AppProps {

}

export interface State {
  message: string;
  events: any[];
}


export const CHANNEL_NAME = 'game';

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
      channels: [CHANNEL_NAME],
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


  handleHello = () => {
    const hello: Message = {
      type: ClientEvent.HELLO,
      value: 'Viljar',
    };
    this.pubnub.publish({
      channel : CHANNEL_NAME,
      message : {"sender": this.uuid, "content": hello}
    }, function(status, response) {
      //Handle error here
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.handleHello}>Hello</button>
      </div>
    );
  }
}


export default Game;
