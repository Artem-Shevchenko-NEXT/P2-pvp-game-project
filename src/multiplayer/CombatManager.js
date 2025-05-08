export default class CombatManager { 
  constructor(scene, gameSync, networkManager) {
    this.scene = scene;
    this.gameSync = gameSync;
    this.network = networkManager;
    this.setupEvents();
    // im adding this class to handle combat sync between players
  }

  setupEvents() {
    // listen for hit events from server
    this.network.socket.on('player_hit', (data) => {
      this.handlePlayerHit(data);
    });

    // listen for shockwave events
    this.network.socket.on('shockwave_created', (data) => {
      this.handleRemoteShockwave(data);
    });
  }

  // this is called when local player hits somone
  registerHit(attacker, target, damage) {
    // only send hit if target is a player with id
    if (target.playerId) {
      this.network.socket.emit('player_hit', {
        targetId: target.playerId,
        damage: damage
      });
    }
    
    // for debugin purposes
    console.log(`Hit registered: ${attacker.characterType} hit ${target.playerId || 'dummy'} for ${damage} damage`);
  }

  // called when local player creates shockwave
  registerShockwave() {
    if (!this.gameSync.localPlayer) return;
    
    this.network.socket.emit('shockwave_created', {
      x: this.gameSync.localPlayer.x,
      y: this.gameSync.localPlayer.y,
      direction: this.gameSync.localPlayer.flipX ? 'left' : 'right'
    });
    
    // debug log
    console.log("Sent shockwave creation event to server");
  }

  // handels hit confermation from server
  handlePlayerHit(data) {
    // find target player
    let targetPlayer;
    if (data.targetId === this.network.playerId) {
      targetPlayer = this.gameSync.localPlayer;
    } else {
      targetPlayer = this.gameSync.remotePlayers.get(data.targetId);
    }
  
    if (targetPlayer) {
      // apply damage
      targetPlayer.health = Math.max(0, targetPlayer.health - data.damage);
      
      // only do HURT state if its the local player
      if (targetPlayer === this.gameSync.localPlayer && !targetPlayer.isInvincible) {
        targetPlayer.stateMachine.transition('HURT');
      }
  
      console.log(`Player ${data.targetId} took ${data.damage} damage, health now: ${targetPlayer.health}`);
      
      // Handle player death if health reaches 0
      if (targetPlayer.health <= 0) {
        console.log(`Player ${data.targetId} has died!`);
        
        // If this is the local player who died
        if (targetPlayer === this.gameSync.localPlayer) {
          // Notify server about death
          this.network.socket.emit('player_died', { 
            killedBy: data.attackerId 
          });
          
          // Visual indicator for defeat
          //targetPlayer.setTint(0x555555);
        }
      }
    }
  }


  // creates shockwave for remote player
  handleRemoteShockwave(data) {
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    
    if (!remotePlayer) return;
    
    if (remotePlayer.characterType === 'tank') {
      remotePlayer.createShockwave();
    }
  }
}