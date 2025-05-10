// client side Socket.IO code
export default class NetworkManager {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.connected = false;
    this.eventListeners = {};
    this.roomId = null;
  }
  
  //Connect to the server
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to server
        this.socket = io();
        
        // Set up connection handlers
        // listens/confirms the succesfulnes of the connection in the broweser console 
        this.socket.on('connect', () => {
          this.connected = true;
          console.log('Connected to server');
        });

        //listener for a custom 'connected' event given by server.js
        this.socket.on('connected', (data) => {
          this.playerId = data.id;
          console.log('Assigned player ID:', this.playerId);
          resolve(data); // finnally oficcialy confirms a seccesfull connection 
          
        });

        // error logging 
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        // clean dissconation
        this.socket.on('disconnect', () => {
          this.connected = false;
          console.log('Disconnected from server');
        });

        // creates game joint event withe the gelp og triggerEvent
        this.socket.on('game_joined', (data) => {
          this.roomId = data.roomId;
          console.log(`Joined room: ${this.roomId}`);
          this.triggerEvent('gameJoined', data);
        });  

        // event listener for player_updated
        this.socket.on('player_updated', (data) => {
          this.triggerEvent('playerUpdated', data);
        });

        // event for player joined
        this.socket.on('player_joined', (data) => {
          console.log(`Player joined: ${data.id}`);
          this.triggerEvent('playerJoined', data);
        });

        //event for player left
        this.socket.on('player_left', (data) => {
          console.log(`Player left: ${data.id}`);
          this.triggerEvent('playerLeft', data);
        });

        // player health update listener
        this.socket.on('player_health_update', (data) => {
          console.log(`Received health update for player ${data.id}: health=${data.health}`);
          this.triggerEvent('playerHealthUpdate', data);
        });

        // listener and event trigger for player hit
        this.socket.on('player_hit', (data) => {
          console.log(`Received player hit: ${data.attackerId} hit ${data.targetId} for ${data.damage} damage`);
          this.triggerEvent('playerHit', data);
        });

        //listener for shockwave events
        this.socket.on('shockwave_created', (data) => {
          console.log('Received shockwave_created event:', data);
          this.triggerEvent('shockwaveCreated', data);
        });

        this.socket.on('shockwave_destroyed', (data) => {
          console.log('Received shockwave_destroyed event:', data);
          this.triggerEvent('shockwaveDestroyed', data);
        });

        //listener for arrow events
        this.socket.on('arrow_created', (data) => {
          console.log('Received arrow_created event:', data);
          this.triggerEvent('arrowCreated', data);
        });

        this.socket.on('arrow_destroyed', (data) => {
          console.log('Received arrow_destroyed event:', data);
          this.triggerEvent('arrowDestroyed', data);
        });

        // responsible for catching any errors such as connect_error in the try block
      } catch (error) {
        console.error('Failed to connect:', error);
        reject(error); // returns the promise as failed
      }
    });
  }
  
  //Register event listener, so that other game parts can lsiten to network events 
  //This allows other game components to listen to network events
  //without directly interacting with Socket.IO
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  //Trigger an event
  triggerEvent(event, data) {
    const callbacks = this.eventListeners[event];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
  
  // Disconnect from the server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
  //send Initial player data
  //called once after conection to set up player in gamelobby
  joinGame(playerData) {
    if (!this.connected) return;
    
    // Geting the character type from Game scene
    const characterType = playerData.characterType || 'tank';
    
    this.socket.emit('join_game', {
      x: playerData.x,
      y: playerData.y,
      characterType: characterType,
      health: playerData.health || 100
    });
  }

  //Send player position update where x and y is the player position adn the extras is for animation and direction facing
  sendPlayerUpdate(x, y, extras = {}) {
    if (!this.connected) return;
    
    const data = {
      x,
      y,
      ...extras
    };
    // debug purpose
    //console.log('Sending player update:', data);
    // emmits the message of player_update for server.js 
    this.socket.emit('player_update', data);
  }
  sendShockwaveDestroyed(id) {
    if (!this.connected) return;
    this.socket.emit('shockwave_destroyed', { id });
  }

  sendArrowDestroyed(id) {
    if (!this.connected) return;
    this.socket.emit('arrow_destroyed', { id });
  }
}