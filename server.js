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
  '*',
  'react-native-app',
];

// Cấu hình CORS cho React Native
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!isProd) {
        return callback(null, true);
      }

      if (!origin || origin === 'null' || origin === 'undefined') {
        return callback(null, true);
      }

      const allowedOrigins = [
        'https://jinstore-api.onrender.com',
        'https://nqhit.github.io',
        'https://nqhit.github.io/JinStore',
        'react-native-app',
        '*',
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
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
    socket.emit('joinedUser', { userId, socketId: socket.id });
  });

  // ✅ Thêm event cho admin join admin room
  socket.on('joinAdmin', (adminId) => {
    socket.join('admin-room'); // Tất cả admin join chung room
    socket.join(adminId); // Admin cũng join room cá nhân
    socket.emit('joinedAdmin', { adminId, socketId: socket.id });
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
