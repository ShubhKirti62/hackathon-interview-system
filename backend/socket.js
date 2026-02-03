const socketIo = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5174",
      methods: ["GET", "POST"]
    }
  });

  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (data) => {
      const { roomId, userName, role } = data;
      
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const room = rooms.get(roomId);
      room.set(socket.id, { userName, role, id: socket.id });
      
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        userName,
        role
      });
      
      socket.emit('room-users', Array.from(room.values()));
      
      console.log(`User ${userName} (${role}) joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.delete(socket.id);
        
        socket.to(roomId).emit('user-left', {
          userId: socket.id
        });
        
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
    });

    socket.on('signaling-message', (data) => {
      const { roomId, message, targetUserId } = data;
      
      if (targetUserId) {
        io.to(targetUserId).emit('signaling-message', {
          message,
          fromUserId: socket.id
        });
      } else {
        socket.to(roomId).emit('signaling-message', {
          message,
          fromUserId: socket.id
        });
      }
    });

    socket.on('chat-message', (data) => {
      const { roomId, message, userName } = data;
      
      const messageData = {
        id: Date.now().toString(),
        userName,
        message,
        timestamp: new Date().toISOString(),
        userId: socket.id
      };
      
      io.to(roomId).emit('chat-message', messageData);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      rooms.forEach((room, roomId) => {
        if (room.has(socket.id)) {
          const user = room.get(socket.id);
          room.delete(socket.id);
          
          socket.to(roomId).emit('user-left', {
            userId: socket.id
          });
          
          if (room.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIo };
