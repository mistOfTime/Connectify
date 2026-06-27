const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.get('/', (req, res) => res.send('Connectify Signaling Server OK'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Queue of users waiting to be matched
const waitingQueue = []; // { socketId, uid, country, gender }
// Active rooms: roomId -> { caller, callee }
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substr(2, 9);
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // User joins the waiting queue
  socket.on('find-match', ({ uid, country, gender }) => {
    console.log('find-match:', socket.id, uid);

    // Remove any existing entry for this socket
    const idx = waitingQueue.findIndex(u => u.socketId === socket.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);

    // Check if someone is already waiting
    const waitingIdx = waitingQueue.findIndex(u => u.uid !== uid);

    if (waitingIdx !== -1) {
      // Match found — create room
      const partner = waitingQueue.splice(waitingIdx, 1)[0];
      const roomId = generateRoomId();

      rooms.set(roomId, { caller: partner.socketId, callee: socket.id });

      // Tell caller to create offer
      io.to(partner.socketId).emit('matched', { roomId, role: 'caller', partnerId: socket.id });
      // Tell callee to wait for offer
      io.to(socket.id).emit('matched', { roomId, role: 'callee', partnerId: partner.socketId });

      console.log('Matched:', partner.socketId, '<->', socket.id, 'room:', roomId);
    } else {
      // No one waiting — add to queue
      waitingQueue.push({ socketId: socket.id, uid, country, gender });
      socket.emit('waiting');
      console.log('Waiting queue size:', waitingQueue.length);
    }
  });

  // Relay WebRTC offer
  socket.on('offer', ({ roomId, offer, to }) => {
    console.log('offer from', socket.id, 'to', to);
    io.to(to).emit('offer', { roomId, offer, from: socket.id });
  });

  // Relay WebRTC answer
  socket.on('answer', ({ roomId, answer, to }) => {
    console.log('answer from', socket.id, 'to', to);
    io.to(to).emit('answer', { roomId, answer, from: socket.id });
  });

  // Relay ICE candidate
  socket.on('ice-candidate', ({ roomId, candidate, to }) => {
    io.to(to).emit('ice-candidate', { roomId, candidate, from: socket.id });
  });

  // Relay audio chunk (server-side audio relay - bypasses TURN/NAT issues)
  socket.on('audio-chunk', ({ to, chunk }) => {
    io.to(to).emit('audio-chunk', { chunk, from: socket.id });
  });

  // Chat message relay
  socket.on('chat-message', ({ roomId, text, to, avatar, name }) => {
    io.to(to).emit('chat-message', { text, avatar, name, from: socket.id });
  });

  // User stopped / disconnected
  socket.on('stop', () => {
    handleDisconnect(socket);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    handleDisconnect(socket);
  });
});

function handleDisconnect(socket) {
  // Remove from waiting queue
  const qIdx = waitingQueue.findIndex(u => u.socketId === socket.id);
  if (qIdx !== -1) waitingQueue.splice(qIdx, 1);

  // Notify room partner
  for (const [roomId, room] of rooms.entries()) {
    if (room.caller === socket.id || room.callee === socket.id) {
      const partnerId = room.caller === socket.id ? room.callee : room.caller;
      io.to(partnerId).emit('partner-disconnected');
      rooms.delete(roomId);
      break;
    }
  }
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling server running on port ${PORT}`);
});
