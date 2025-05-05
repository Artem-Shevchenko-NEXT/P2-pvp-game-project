import { createServer } from "node:http";
import { io as ioc } from "socket.io-client";
import { Server } from "socket.io";
import NetworkManager from '../src/multiplayer/NetworkManager';

// Helper function from Socket.IO docs to wait for specific events
// Source: https://socket.io/docs/v4/testing/
function waitFor(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

describe("NetworkManager", () => {
  let io, serverSocket, clientSocket, httpServer, networkManager;
  const PORT = 3002; // Using a different port than our main game to avoid conflicts

  beforeAll((done) => {
    // Setting up a test server following Socket.IO docs approach
    httpServer = createServer();
    io = new Server(httpServer);
    
    httpServer.listen(PORT, () => {
      // Adding server-side event handlers to simulate our actual game server
      io.on("connection", (socket) => {
        serverSocket = socket;
        
        // Mock server responses similar to our game server implementation
        socket.on('join_game', (data) => {
          socket.emit('game_joined', { 
            roomId: 'test-room',
            players: [{ id: socket.id, x: data.x, y: data.y }]
          });
        });
        
        socket.on('player_update', (data) => {
          // Broadcast to simulate other players receiving updates
          socket.broadcast.emit('player_updated', {
            id: socket.id,
            ...data
          });
        });
        
        socket.emit('connected', { id: socket.id });
      });
      
      // Override global io to use our test server
      global.io = () => ioc(`http://localhost:${PORT}`);
      
      networkManager = new NetworkManager();
      done();
    });
  });

  afterAll(() => {
    // Clean up all connections to prevent memory leaks
    if (networkManager && networkManager.socket) {
      networkManager.disconnect();
    }
    io.close();
    httpServer.close();
  });

  test("should connect to server successfully", async () => {
    // Testing our connection method works properly
    const connectResult = await networkManager.connect();
    
    expect(networkManager.connected).toBe(true);
    expect(connectResult).toBeDefined();
    expect(connectResult.id).toBeDefined();
    expect(networkManager.playerId).toBe(connectResult.id);
  });

  test("should join game and receive room id", async () => {
    // Need to set up a promise to capture the async event
    const gameJoinedPromise = new Promise((resolve) => {
      networkManager.on('gameJoined', resolve);
    });
    
    // Call our join method with test coordinates
    networkManager.joinGame({ x: 100, y: 200 });
    
    // Wait for the response and check if we got the right room info
    const data = await gameJoinedPromise;
    expect(data.roomId).toBe('test-room');
    expect(networkManager.roomId).toBe('test-room');
  });

  test("should send player updates when connected", async () => {
    // Use the helper function to wait for server to receive our update
    const playerUpdatePromise = waitFor(serverSocket, 'player_update');
    
    // Send a position update with animation data
    networkManager.sendPlayerUpdate(150, 250, { animation: 'run' });
    
    // Verify the server received exactly what we sent
    const updateData = await playerUpdatePromise;
    expect(updateData).toEqual({
      x: 150,
      y: 250,
      animation: 'run'
    });
  });

  test("should receive player updates from server", async () => {
    // This test checks if our event system properly handles updates from other players
    const playerUpdatedPromise = new Promise((resolve) => {
      networkManager.on('playerUpdated', resolve);
    });
    
    // Simulate another player sending an update through the server
    serverSocket.emit('player_updated', {
      id: 'another-player',
      x: 300,
      y: 400,
      animation: 'jump'
    });
    
    // Check if we received and processed the update correctly
    const data = await playerUpdatedPromise;
    expect(data.id).toBe('another-player');
    expect(data.x).toBe(300);
    expect(data.y).toBe(400);
    expect(data.animation).toBe('jump');
  });

  test("should register and trigger event listeners", () => {
    // Testing our internal event system that other game components use
    const mockCallback = jest.fn();
    networkManager.on('testEvent', mockCallback);
    
    networkManager.triggerEvent('testEvent', { test: 'data' });
    
    expect(mockCallback).toHaveBeenCalledWith({ test: 'data' });
  });

  test("should not send player update when not connected", async () => {
    // Important to check that we don't try to send messages when offline
    const offlineManager = new NetworkManager();
    
    // Just to be 100% sure of the test conditions
    offlineManager.socket = { emit: jest.fn() };
    offlineManager.connected = false;
    
    offlineManager.sendPlayerUpdate(100, 200);
    
    expect(offlineManager.socket.emit).not.toHaveBeenCalled();
  });
});