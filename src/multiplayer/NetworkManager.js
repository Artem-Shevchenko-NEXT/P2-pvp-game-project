// client side Socket.IO code
export default class NetworkManager {
    constructor() {
      this.socket = null;
      this.playerId = null;
      this.connected = false;
      this.eventListeners = {};
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
          // responsible for catching any errors such as connect_error in the try block
        } catch (error) {
          console.error('Failed to connect:', error);
          reject(error); // returns the promise as failed
        }
      });
    }
    
    //Register event listener, so that other game parts can lsiten to network events 
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
}