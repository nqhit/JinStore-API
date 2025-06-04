const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app); // tạo HTTP server từ app

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'], // origin frontend
    credentials: true,
  },
});

// Lưu instance io vào app để dùng trong controller
app.set('io', io);

// Bắt sự kiện socket
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('joinUser', (userId) => {
    console.log(`✅ User ${userId} joined room`);
    socket.join(userId); // Tham gia room theo user
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO is active`);
});
