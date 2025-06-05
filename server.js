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
  socket.on('joinUser', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // ✅ Thêm event cho admin join admin room
  socket.on('joinAdmin', (adminId) => {
    socket.join('admin-room'); // Tất cả admin join chung room
    socket.join(adminId); // Admin cũng join room cá nhân
    console.log(`Admin ${adminId} joined admin room`);
  });
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO is active`);
});
