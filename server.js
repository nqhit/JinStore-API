const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const getLocalIP = require('./src/utils/ipNetwork');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
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
  const ip = getLocalIP();
  console.log(`Server is running at:`);
  console.log(`  - Local:   http://localhost:${PORT}/api`);
  console.log(`  - Network: http://${ip}:${PORT}/api`);
  console.log(`📡 Socket.IO is active`);
});
