// Handles game synchronizastion beetween players

import NetworkManager from './NetworkManager.js';

export default class GameSync2 {
  constructor(scene, networkManager) {
    this.scene = scene;
    this.network = networkManager;
    this.localPlayer = null;
    this.remotePlayers = new Map(); // Map of player ID to player game objects
    
    // Just a demo to show we recieve player data from server
    console.log("GameSync2 created! Ready to recieve player data");
    
    // Setup network events
    this.setupEvents();
  }
  
  // Set up network event handlers
  setupEvents() {
    // Handle game joined with existing players
    this.network.on('gameJoined', (data) => {
      console.log('Joined game room:', data.roomId);
      console.log('Got these players from server:', data.players);
      
      // Show server is sending us player datas
      data.players.forEach(player => {
        if (player.id !== this.network.playerId) {
          console.log(`Found player ${player.id} at position x=${player.x}, y=${player.y}`);
          this.addRemotePlayer(player);
        }
      });
    });
    
    // Handle player updates
    this.network.on('playerUpdated', (data) => {
      console.log(`Got update for player ${data.id}: x=${data.x}, y=${data.y}`);
      // TODO: implement updating of remote players position and animation
      this.updateRemotePlayer(data);
    });
    
    // TODO: Add more event handlers here when we implement player joined/left events
    // this.network.on('playerJoined', ...) example
    this.network.on('playerJoined', (data) => {
      console.log(`New player joined: ${data.id}`);
      this.addRemotePlayer(data);
    });
    // this.network.on('playerLeft', ...)
  }
  
  // Set local player 
  setLocalPlayer(player) {
    this.localPlayer = player;
    console.log("Local player setted to:", player);
  }
  
  // Add a remote player
  addRemotePlayer(playerData) {
    // Skip if this is local player or already exists
    if (playerData.id === this.network.playerId) return;
    if (this.remotePlayers.has(playerData.id)) return;
    
    console.log(`Creating remote player ${playerData.id} at (${playerData.x}, ${playerData.y})`);
    
    // TODO: Create actual player object here
    // For now just track basic data as placeholder
    const remotePlayer = {
      id: playerData.id,
      x: playerData.x,
      y: playerData.y
    };
    
    this.remotePlayers.set(playerData.id, remotePlayer);
    console.log("Remote players now:", this.remotePlayers);
  }
  
  // Update a remote player
  updateRemotePlayer(data) {
    const remotePlayer = this.remotePlayers.get(data.id);
    if (!remotePlayer) {
      console.log(`Cant update player ${data.id} because they dont exist`);
      return;
    }
    
    // Update players position
    remotePlayer.x = data.x;
    remotePlayer.y = data.y;
    
    // Just logging to demonstrate its working
    console.log(`Updated remote player ${data.id} to position x=${data.x}, y=${data.y}`);
    
    // TODO: Update player sprite position and animation
    // TODO: Handle player facing direction
    // TODO: Make sure player visible in game world
  }
  
  // Remove a remote player
  removeRemotePlayer(playerId) {
    // TODO: Implement player removal when they disconnect
    console.log(`Should remove player ${playerId} but not implemented yet`);
    
  }

    // Calculate interpolated position (from existing code)
  interpolation(previous, velocity, acceleration, time) {
    return previous + velocity*time + ((acceleration/2) * time*time);
  }
}