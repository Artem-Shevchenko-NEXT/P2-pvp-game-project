// lobby management for multiplayer matches
class LobbyManager {
  constructor() {
    // only has the defualt main room for now 
    this.defaultRoom = 'main';
  }
  
  // method for getting the  Get default room

  getDefaultRoom() {
    return this.defaultRoom;
  }
}

module.exports = LobbyManager;