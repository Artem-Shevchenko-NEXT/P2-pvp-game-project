//Handles game synchronization

/* Hey, im writing in english so that i will have a log i could use for when the report is gonna be written 
---Also i just want to clarify what my ida with this class  was as i kind of built the networkmanager twoards that
---but feel free to do it in whateverway you want  + feel free to delet this comment section

as i said, when we talked yesterday ths code/class should handle the synchronization of game state 
between the local player and remote players. so basically it shoudl function as a bridge between 
the NetworkManager and the Game scene.

The main responsibilities of this class should somthing along these lines :
managing remote player instances(by witch i mean rendering players from different windows) in the game
handling network events related to playr joinning/leaving
updating remote player positions and animations based on received data
providing methods to easily synchronize local player state

as i said for thsi it would be best to work with the existing NetworkManager which already handles 
the socket connection and provides events through the .on() method. 
The NetworkManager can listen for:
'gameJoined'  When the player successfully joins a game room
'playerUpdated' - When another player sends position updates
 
you will need to tinker with the Game scene(Game.js),to add code for the remote player creation
and keep their visual represantation in sync with the data received from the server.

you will also nedd to tinker with server.js, check  the 'TODO:' comment

Lastly the Game scene (Game.js) already handles sendinng player updates to the server throug NetworkManager,
but if you want you can move that logic into this clas for consistency.

(extra info: the browser console will only show the updates that the local player is sending, 
but the serve itself recives all updates from all players together at the same time)
 */

// managing remote player instances(by which i mean rendering players from different windows) in the game
    // player rendering
// handling network events related to player joinning/leaving
    //Forsøg at bruge socket.on('gameJoined') 
// updating remote player positions and animations based on received data
    //forsøg at bruge socket.on('playerUpdated')


//sammenkoble statemachine, og lav clients opdatere, med dataen serveren får



/*funktionen fungerer ikke endnu, fordi jeg ikke har givet de ordentlige variabler,
 og der er også nogle ting som går igen i NetworkManager.js og server.js
 Men det ligger et frame for det jeg skal bygge
*/


const { io } = require('./server');
//læs hvordan den fungerer
/*
export default class GameSync {
  constructor(scene, networkManager) {
    this.scene = scene;
    this.network = networkManager;
    this.localPlayer = null;
    this.remotePlayers = new Map(); // Map af player ID  til player objekter eller nogen andet

    // Setup network events
    this.setupEvents();
    
    constructor(io) 
        this.io = io;
    
        this.io.on('connection', (socket) => {
          console.log('Client connected in GameSync');
          // Handle events
        });
      }

  
}
*/

/*
this.network.on('playerUpdated', (data) => {
   this.updateRemotePlayer(data);
});
*/
//sikrer at der er en connection
//causes an error
/*
io.on('connection', (socket) => {
    console.log('Server is running');

        //Sender data når en player disconnecter
    socket.on('disconnect', () => {
        //Jeg ved ikke om "player" er den rigtige ting at kalde her
        delete player[socket.id];
        socket.broadcast.emit('User disconnected:', socket.id);
    });

    //Sender data når en player bevæger sig
    socket.on('move',(data) => {
        if (player[socket.id]) {
            //player[socket.id] = data;
            socket.broadcast.emit('playerMoved', { id: socket.id, player: data });
        }
    });

    socket.on('newPlayer', () => {
        player[socket.id] = {
        //player size/position (jeg ved ikke hvor de bliver initialiseret)
          x: 1,
          y: 1,
          width: 1,
          height: 1
        }
    })
    //gamestate.players skal erstattes med den const som initialiserer playeren
    socket.on('state', (players) => {
        //player skal være variablen som holder player dataen
        for (let player in players) {
            //drawPlayer skal erstattes med den const, som giver playeren position  
            //drawPlayer(players[player])
        }
    })

    //ved ikke helt hvad der skal være her
    socket.on('game_joined',(data) => {

    })

    socket.on('playerUpdated', (data) => {

    })

});

//decides sync rate (currently set to 60 times per second)
setInterval(() => {
    io.sockets.emit('state', players);
}, 1000 / 60);

//interpolation calculates the characters expected position (clientside)
//Skal kaldes med variablerne fra socket.on('playerUpdated')
function interpolation(previous, velocity, acceleration, time){
    return previous + velocity*time + ((acceleration/2) * time*time);
}
*/
