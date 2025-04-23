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
          this.socket.on('connect', () => {
            this.connected = true;
            console.log('Connected to server');
          });
          
          this.socket.on('connected', (data) => {
            this.playerId = data.id;
            console.log('Assigned player ID:', this.playerId);
            resolve(data);
          });
          
          this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            reject(error);
          });
          
          this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('Disconnected from server');
          });
          
        } catch (error) {
          console.error('Failed to connect:', error);
          reject(error);
        }
      });
    }
    
    //Register event listener
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