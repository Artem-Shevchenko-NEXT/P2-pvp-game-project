var express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;
const RoomManager = require('./server/LobbyManager');
const LobbyManager = require('./server/LobbyManager');

// giving directionory forfiles that the server can utilize a
app.use(express.static(__dirname));
app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Initialize room manager
const roomManager = new LobbyManager();
// Track players in rooms
const players = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send player their ID
  socket.emit('connected', { id: socket.id });
    // Handle player joining game
  socket.on('join_game', (playerData) => {
    // all players join the default room as defined in the lobbyManager
    const roomId = roomManager.getDefaultRoom();
    socket.join(roomId);
    
    // Add player to tracking
    const player = {
      id: socket.id,
      x: playerData.x || 100,
      y: playerData.y || 100,
      roomId: roomId
    };
    
    players.set(socket.id, player);
    console.log(`Player ${socket.id} joined room ${roomId}`);
    // player update handling logic
    socket.on('player_update', (data) => {
      const player = players.get(socket.id);
      if (player) {
        // Update the  position
        if (data.x !== undefined) player.x = data.x;
        if (data.y !== undefined) player.y = data.y;
        if (data.animation !== undefined) player.animation = data.animation;
        if (data.facing !== undefined) player.facing = data.facing;
        
        // Broadcast to other players in the same room
        socket.to(player.roomId).emit('player_updated', {
          id: socket.id,
          x: player.x,
          y: player.y,
          animation: player.animation,
          facing: player.facing
        });
      }
    });
    // succefull join notification
    socket.emit('game_joined', {
      roomId: roomId,
      players: Array.from(players.values())
        .filter(p => p.roomId === roomId)
    });
  });
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove player from tracking
    players.delete(socket.id);
  });
});

// Server initiation
http.listen(port, () => {
    console.log(`Socket.IO server running on port ${port}`);
    console.log(`Access at http://130.225.37.31:${port}/`);
});

/* Socket.IO docs

socket.emit('message', "this is a test"); //sending to sender-client only

socket.broadcast.emit('message', "this is a test"); //sending to all clients except sender

socket.broadcast.to('game').emit('message', 'nice game'); //sending to all clients in 'game' room(channel) except sender

socket.to('game').emit('message', 'enjoy the game'); //sending to sender client, only if they are in 'game' room(channel)

socket.broadcast.to(socketid).emit('message', 'for your eyes only'); //sending to individual socketid

io.emit('message', "this is a test"); //sending to all clients, include sender

io.in('game').emit('message', 'cool game'); //sending to all clients in 'game' room(channel), include sender

io.of('myNamespace').emit('message', 'gg'); //sending to all clients in namespace 'myNamespace', include sender

socket.emit(); //send to all connected clients

socket.broadcast.emit(); //send to all connected clients except the one that sent the message

socket.on(); //event listener, can be called on client to execute on server

io.sockets.socket(); //for emiting to specific clients

io.sockets.emit(); //send to all connected clients (same as socket.emit)

io.sockets.on() ; //initial connection from a client.

*/