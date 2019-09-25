import React from 'react';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';
import PubNub from 'pubnub';
import QRCode from 'qrcode.react';
import './App.css';
import Game from './Game';
import {
  Answer,
  Client,
  ClientAnswerMessage, ClientByeMessage,
  ClientEvent,
  ClientHelloMessage, GameClientJoinedMessage, GameClientLeftMessage,
  GameEndMessage,
  GameEvent,
  GameQuestionMessage,
  GameRoundEndMessage,
  GameStartMessage,
  Message,
  MessageContent
} from './ApiTypes';

export interface AppProps {

}

enum GameState {
  WAITING_CLIENTS = 'WAITING_CLIENTS',
  SEND_QUESTION = 'SEND_QUESTION',
  WAITING_ANSWER = 'WAITING_ANSWER',
  DISPLAY_ANSWER = 'DISPLAY_ANSWER',
  DISPLAY_RESULTS = 'DISPLAY_RESULTS',
}

export interface State {
  message: string;
  events: PubNub.MessageEvent[];
  clients: Client[];
  questions: string[];
  allQuestions: string[];
  gameState: GameState;
  activeClient: string;
  activeQuestion: string;
  answers: Answer[],
  questionCount: number | undefined,
}

export class App extends React.Component<AppProps, State> {
  private pubnub: PubNub;
  private uuid: string;
  private channelId: string;
  private eventContainerRef = React.createRef<HTMLDivElement>();

  constructor(props: AppProps) {
    super(props);
    this.uuid = PubNub.generateUUID();
    this.channelId = PubNub.generateUUID();
    this.pubnub = new PubNub({
      publishKey: 'pub-c-bd289ae2-d65d-4100-8ddd-a514558bbf7a',
      subscribeKey: 'sub-c-51d1abbe-ce3b-11e9-9b51-8ae91c2a8a9f',
      uuid: this.uuid
    });
    this.state = {
      message: '',
      events: [],
      clients: [],
      questions: [],
      allQuestions: [],
      gameState: GameState.WAITING_CLIENTS,
      activeClient: '',
      activeQuestion: '',
      answers: [],
      questionCount: 3,
    }
  }

  componentDidMount() {
    this.pubnub.subscribe({
      channels: [this.channelId],
      withPresence: true
    });

    this.pubnub.addListener({
      message: (event) => {
        console.log('got message', event);
        if (event.message.content) {
          if (event.message.content.type === ClientEvent.HELLO) {
            this.handleHELLO(event.message);
          }
          if (event.message.content.type === ClientEvent.ANSWER) {
            this.handleANSWER(event.message);
          }
          if (event.message.content.type === ClientEvent.BYE) {
            this.handleBYE(event.message);
          }
          if (event.message.content.type === ClientEvent.START_GAME) {
            if (this.state.clients.find((c) => c.clientId === event.message.sender && c.vip)) {
              this.startGame();
            } else {
              alert('not client or VIP!');
            }
          }
        } else {
          console.warn("message with no content!");
        }

        this.setState({
          events: [...this.state.events, event],
        }, () => {
          if (this.eventContainerRef && this.eventContainerRef.current) {
            this.eventContainerRef.current.scrollTop = this.eventContainerRef.current.scrollHeight;
          }
        })
      },
      presence: (event) => {
        console.log('got presence', event);
      }
    });

    fetch('https://sheets.googleapis.com/v4/spreadsheets/1HmpuQN-CdIBeFyBXlfyuTIIb2cL-Fxm-U93uGmitDV8/values/Leht1!a1:a999/?key=AIzaSyAG0PvvSeDqmehk15UBNNbwbS8nVoLxr4M').then((r) => r.json()).then((result) => {
      console.log('result', result.values.map((v: any) => v.join()));
      this.setState({
        questions: result.values.map((v: any) => v.join()),
        allQuestions: result.values.map((v: any) => v.join()),
      })
    })
  }

  componentWillUnmount() {
    this.pubnub.unsubscribeAll();
  }

  getClientName = (clientId: string) => {
    const client = this.state.clients.find((c) => c.clientId === clientId);
    if (client) {
      return client.name;
    }
    return '';
  };

  getSenderName = (e: PubNub.MessageEvent) => {
    if (!e.message) {
      return '';
    }
    if (e.message.sender === this.uuid) {
      return 'Host';
    }
    const sender = this.state.clients.find((c) => e.message && c.clientId === e.message.sender);
    if (sender) {
      return sender.name;
    }
    return e.message.sender;
  };

  handleHELLO = (e: Message<ClientHelloMessage>) => {
    if (this.state.gameState !== GameState.WAITING_CLIENTS) {
      return;
    }
    if (!this.state.clients.find((c) => c.clientId === e.sender)) {
      this.setState({
        clients: [...this.state.clients,
          {
            clientId: e.sender,
            name: e.content.value,
            vip: this.state.clients.length === 0,
          }],
      }, () => {
        const gameClientJoinedMessage: GameClientJoinedMessage = {
          value: this.state.clients,
          type: GameEvent.CLIENT_JOINED,
        };
        this.send(gameClientJoinedMessage);
      });
    }
  };

  handleANSWER = (e: Message<ClientAnswerMessage>) => {
    if (this.state.gameState !== GameState.WAITING_ANSWER) {
      return;
    }

    const answer: Answer = {
      question: this.state.activeQuestion,
      clientId: e.content.value.clientId
    };
    this.setState({
      gameState: GameState.DISPLAY_ANSWER,
      answers: [...this.state.answers, answer]
    });
  };

  handleBYE = (e: Message<ClientByeMessage>) => {
    this.setState({
      clients: this.state.clients.filter((c) => c.clientId !== e.sender),
    }, () => {
      const gameClientLeftMessage: GameClientLeftMessage = {
        value: this.state.clients,
        type: GameEvent.CLIENT_LEFT,
      };
      this.send(gameClientLeftMessage);
    })
  };

  send = (message: MessageContent<any>) => {
    this.pubnub.publish({
      channel: this.channelId,
      message: {
        sender: this.uuid,
        content: message,
      },
    }, (status, response) => {
      //Handle error here
    });
  };

  handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const key = e.key;
    if (key === 'Enter') {
      e.preventDefault();
      this.send({
        type: GameEvent.TEST,
        value: this.state.message,
      });
      this.setState({
        message: '',
      });
    }
  }

  handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      message: e.target.value,
    });
  }

  handleClientRemove = (client: Client) => {
    this.setState({
      clients: this.state.clients.filter((c) => c.clientId !== client.clientId),

    })
  };

  startGame = () => {
    this.setState({
      questions: shuffle(this.state.allQuestions.slice()).slice(0, this.state.questionCount),
      gameState: GameState.SEND_QUESTION,
    });

    const gameStartMessage: GameStartMessage = {
      type: GameEvent.START,
      value: this.state.clients,
    };
    this.send(gameStartMessage)
  }

  componentDidUpdate(prevProps: Readonly<AppProps>, prevState: Readonly<State>, snapshot?: any): void {
    if (prevState.gameState !== this.state.gameState) {
      // gameState updated, lets handle the cases here
      if (this.state.gameState === GameState.SEND_QUESTION) {
        this.handleSendQuestion();
      }
      if (this.state.gameState === GameState.DISPLAY_ANSWER) {
        this.handleDisplayAnswer();
      }
      if (this.state.gameState === GameState.DISPLAY_RESULTS) {
        this.handleDisplayResults();
      }
    }
  }

  getUniqueQuestion = () => {
    const question = this.state.questions[Math.floor(Math.random() * this.state.questions.length)];
    this.setState({
      questions: this.state.questions.filter((q) => q !== question),
      activeQuestion: question,
    });
    return question;
  };

  handleSendQuestion = (activeClient = this.state.activeClient) => {
    if (!this.state.clients.length) {
      alert('no clients!');
      this.setState({
        gameState: GameState.WAITING_CLIENTS,
      });
      return;
    }
    if (!activeClient && this.state.clients.length) {
      activeClient = this.state.clients[0].clientId;
      this.setState({
        activeClient,
      });
    }
    const questionMessage: GameQuestionMessage = {
      type: GameEvent.QUESTION,
      value: {
        players: this.state.clients,
        question: this.getUniqueQuestion(),
        to: activeClient,
      }
    };
    this.send(questionMessage);
    this.setState({
      gameState: GameState.WAITING_ANSWER,
    })
  };

  handleDisplayAnswer = () => {
    const roundEndMessage: GameRoundEndMessage = {
      value: this.state.answers.reverse()[0],
      type: GameEvent.ROUND_END
    };
    this.send(roundEndMessage);

    setTimeout(() => {
      if (this.state.questions.length === 0) {
        this.setState({
          gameState: GameState.DISPLAY_RESULTS,
        });
      } else {
        const activeClientIndex = this.state.clients.findIndex((c) => c.clientId === this.state.activeClient);
        let newActiveClientIndex = 0;
        if (activeClientIndex + 1 < this.state.clients.length) {
          newActiveClientIndex = activeClientIndex + 1;
        }
        this.setState({
          activeClient: this.state.clients[newActiveClientIndex].clientId,
          gameState: GameState.SEND_QUESTION,
        })
      }
    }, 1 * 1000);
  };

  handleDisplayResults = () => {
    const gameEndMessage: GameEndMessage = {
      value: this.state.answers,
      type: GameEvent.END
    };
    this.send(gameEndMessage);
  };

  render() {
    return (
      <div className="main">
        <div className="game">
          <div className="block question"> {
            (this.state.gameState === GameState.WAITING_ANSWER ||
              this.state.gameState === GameState.DISPLAY_ANSWER) && this.state.activeQuestion}</div>
          <div className="block answer">{this.state.gameState === GameState.DISPLAY_ANSWER && (
            // this.getClientName(this.state.answers.reverse()[0].clientId)
            <p>answer hidden</p>
          )}</div>
          {this.state.gameState === GameState.DISPLAY_RESULTS && (
            <ul className="block answers">
              {Object.keys(groupBy(this.state.answers, 'clientId')).map((keyName, i) => (
                <li className="answers__person">
                  {this.getClientName(keyName)}
                  {groupBy(this.state.answers, 'clientId')[keyName].map((a: Answer) => (
                    <p>{a.question}</p>
                  ))}
                </li>
              ))}
            </ul>
          )
          }
          <div className="block qr">
            <div className="qr__code">
              <QRCode value={this.channelId} size={200}/>
            </div>
            <div>
              <label>
                Question count <br/>
                <input type="text" value={this.state.questionCount} onChange={(e) => {
                  const value = Number(e.target.value);
                  this.setState({
                    questionCount: value || undefined,
                  })
                }}/>
              </label>
            </div>
            <h4>channel: {this.channelId}</h4>
          </div>
        </div>
        <div className="debug">
          <div className="block gamestate">{this.state.gameState} {this.getClientName(this.state.activeClient)}</div>
          <div className="block events-wrap">
            <h3>Events</h3>
            <div className="events" ref={this.eventContainerRef}>
              {this.state.events.map((e) => (
                <div className="events__event" key={e.timetoken}>
                  {this.getSenderName(e)} :: <JSONPretty id="json-pretty" json={e.message.content ? e.message.content : e.message}/>
                </div>
              ))}
            </div>
          </div>
          <div className="block clients-wrap">
            <h3>Clients</h3>
            <div className="clients">
              {this.state.clients.map((c, i) => (
                <div className="events__event" key={i}>
                  {c.name} - {c.clientId}
                  <button onClick={() => {
                    this.handleClientRemove(c)
                  }}>X
                  </button>
                  <button onClick={() => {
                    this.handleSendQuestion(c.clientId);
                  }}>
                    Send question
                  </button>
                  {this.state.activeClient === c.clientId && (
                    <button onClick={() => {
                      const answer: ClientAnswerMessage = {
                        type: ClientEvent.ANSWER,
                        value: {
                          clientId: c.clientId,
                        }
                      };
                      this.send(answer);
                    }}>
                      Send answer myself
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <textarea onChange={this.handleChange} value={this.state.message} onKeyDown={this.handleEnter}/>
          <button onClick={this.startGame}>Start</button>
          <Game channelId={this.channelId} name="Test 1"/>
          <Game channelId={this.channelId} name="Test 2"/>
        </div>
      </div>
    );
  }
}

const groupBy = (items: any[], key: string) => items.reduce(
  (result: any, item: any) => ({
    ...result,
    [item[key]]: [
      ...(result[item[key]] || []),
      item,
    ],
  }),
  {},
);

function shuffle(array: any[]) {

  var currentIndex = array.length;
  var temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;

}

export default App;
