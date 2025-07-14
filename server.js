const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const getLocalIP = require('./src/utils/ipNetwork');

const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'https://jinstore-api.onrender.com',
  'https://nqhit.github.io',
  'https://nqhit.github.io/JinStore',
  'react-native-app',
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // chỉ truyền danh sách domain hợp lệ
    credentials: true,
  },
});

io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;

  // ✅ Local dev: cho phép tất cả
  if (!isProd) {
    return next();
  }

  // ✅ Production: kiểm tra nghiêm ngặt
  if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
    return next();
  }

  console.warn('❌ Blocked Socket.IO origin:', origin);
  return next(new Error('Not allowed by CORS (Socket.IO middleware)'));
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

const ip = getLocalIP();
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running at:`);
  console.log(`  - Local:   http://localhost:${PORT}/api`);
  console.log(`  - Network: http://${ip}:${PORT}/api`);
  console.log(`📡 Socket.IO is active`);
});
app.get(['/api', '/'], (req, res) => {
  res.send(`Server is running at:<br>
  - Local: http://localhost:${PORT}/api<br>
  - Network: http://${ip}:${PORT}/api<br>
  📡 Socket.IO is active`);
});
