export default class CombatManager { 
  constructor(scene, gameSync, networkManager) {
    this.scene = scene;
    this.gameSync = gameSync;
    this.network = networkManager;
    this.setupEvents();
    // im adding this class to handle combat sync between players
  }

  setupEvents() {
    // listen for hit events from NetworManager
    this.network.on('playerHit', (data) => {
        this.handlePlayerHit(data);
    });

    // Use the NetworkManager event system
    this.network.on('shockwaveCreated', (data) => {
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
    // Find target player
    let targetPlayer;
    if (data.targetId === this.network.playerId) {
      targetPlayer = this.gameSync.localPlayer;
    } else {
      targetPlayer = this.gameSync.remotePlayers.get(data.targetId);
    }
  
    if (targetPlayer) {
      // Apply damage
      targetPlayer.health = Math.max(0, targetPlayer.health - data.damage);
      
      if (!targetPlayer.isInvincible) {
        if (targetPlayer === this.gameSync.localPlayer) {
          // For local player, use state machine
          targetPlayer.stateMachine.transition('HURT');
          
          // Visual feedback with flash effect
          this.scene.tweens.add({
            targets: targetPlayer,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 3
          });
        } else {
          // For remote players, send animation update through the standard network update system
          // This will be processed by the regular animation pipeline already in place
          this.network.socket.emit('remote_animation_update', {
            playerId: targetPlayer.playerId,
            animation: 'hurt',
            facing: targetPlayer.flipX ? 'left' : 'right'
          });
          
          // Flash effect helps provide immediate visual feedback
          this.scene.tweens.add({
            targets: targetPlayer,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 3
          });
        }
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
    console.log('Handling remote shockwave creation from player:', data.playerId);
    
    const remotePlayer = this.gameSync.remotePlayers.get(data.playerId);
    
    if (!remotePlayer) {
      console.log(`Can't create shockwave: Player ${data.playerId} not found`);
      return;
    }
    
    // Set player direction based on data from server before creating shockwave
    if (data.direction === 'left') {
      remotePlayer.flipX = true;
    } else if (data.direction === 'right') {
      remotePlayer.flipX = false;
    }
    
    console.log(`Creating shockwave for remote player ${data.playerId} (${remotePlayer.characterType}) facing ${data.direction}`);
    
    if (remotePlayer.characterType === 'tank') {
      remotePlayer.createShockwave();
      console.log(`Remote shockwave created successfully at (${remotePlayer.x}, ${remotePlayer.y})`);
    }
  }
}