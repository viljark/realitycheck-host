# Client prerequisites (Expo)
https://docs.expo.io/versions/latest/introduction/installation/

`npm install -g expo-cli` ~ 130.63 MiB

download the expo app to your phone

https://docs.expo.io/versions/latest/workflow/up-and-running/

and using typescript - https://docs.expo.io/versions/v34.0.0/guides/typescript/

`expo init`

any config/setup issues? see https://github.com/viljark/eesti-ilm


# Reality check host

## this is a simple host and game manager for reality check card game

### the client has to implement the following logic:
- https://www.pubnub.com/docs/web-javascript/pubnub-javascript-sdk
- connecting to a game host (QR code is the channel ID)
- initialize the PubNub client with the application's publish and subscribe keys
- ```     
  this.uuid = PubNub.generateUUID(); // this will be the ID host will use to identify you
  this.pubnub = new PubNub({
    publishKey: 'pub-c-bd289ae2-d65d-4100-8ddd-a514558bbf7a',
    subscribeKey: 'sub-c-51d1abbe-ce3b-11e9-9b51-8ae91c2a8a9f',
    uuid: this.uuid
  });
  ```  
- connect to the channelId you received from the QR code
- ```
    this.pubnub.subscribe({
      channels: [this.props.channelId],
      withPresence: true
    });
  ```
- handle the Game events when it is your turn, and send the client events when needed
    - Send `Message<ClientHelloMessage>` to introduce yourself and register to host, See `ApiTypes.ts` for details.
    - Send `Message<ClientAnswerMessage>` when it is your turn and you want to send an answer, See `ApiTypes.ts` for details.
    - Handle `Message<GameClientJoinedMessage>`, you'll receive `Client[]`as value (list of players)
    - Handle `Message<GameClientLeftMessage>`, you'll receive `Client[]`as value (list of players)
    - Handle `Message<GameStartMessage>`, you'll receive `Client[]`as value (list of players)
    - Handle `Message<GameQuestionMessage>`, you'll receive ``Question`` as response, where 
                                                    
        - to: player who this question is addressed
        - question: question text
        - players: list of players 
        
    - Handle `Message<GameRoundEndMessage>`, you'll receive `Answer`
    - Handle `Message<GameEndMessage>`, you'll receive `Answer[]`
