const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const getLocalIP = require('./src/utils/ipNetwork');

const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

// ✅ Danh sách domain được phép (production)
const allowedOrigins = [
  'https://jinstore-api.onrender.com',
  'https://nqhit.github.io',
  'https://nqhit.github.io/JinStore',
  'http://localhost:5173/',
];

// ✅ Cấu hình CORS linh hoạt cho React Native và Web
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // ✅ Development: cho phép tất cả
      if (!isProd) {
        return callback(null, true);
      }

      // ✅ Production: xử lý các trường hợp đặc biệt
      // React Native, Expo, và một số mobile app không có origin
      if (
        !origin ||
        origin === 'null' ||
        origin === 'undefined' ||
        origin === 'capacitor://localhost' || // Capacitor
        origin === 'ionic://localhost' || // Ionic
        origin.startsWith('exp://') || // Expo development
        origin.startsWith('exps://') || // Expo secure
        origin.startsWith('file://') || // Local file
        origin.includes('expo.dev') || // Expo web
        origin.includes('expo.io')
      ) {
        // Expo legacy
        return callback(null, true);
      }

      // ✅ Kiểm tra whitelist domains
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ✅ Log để debug
      console.warn('❌ Blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  // ✅ Thêm config để tương thích mobile
  allowUpgrades: true,
  upgradeTimeout: 30000,
});

// ✅ Middleware Socket.IO đã cải thiện
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;
  const userAgent = socket.handshake.headers['user-agent'];

  // ✅ Development: cho phép tất cả
  if (!isProd) {
    console.log('🔧 Dev mode - allowing all connections');
    return next();
  }

  // ✅ Production: kiểm tra linh hoạt
  console.log('🔍 Checking connection:', { origin, userAgent });

  // React Native và mobile apps
  if (
    !origin ||
    origin === 'null' ||
    origin === 'undefined' ||
    origin === 'capacitor://localhost' ||
    origin === 'ionic://localhost' ||
    origin.startsWith('exp://') ||
    origin.startsWith('exps://') ||
    origin.startsWith('file://') ||
    origin.includes('expo.dev') ||
    origin.includes('expo.io')
  ) {
    console.log('✅ Mobile/React Native connection allowed');
    return next();
  }

  // Web domains
  if (allowedOrigins.includes(origin)) {
    console.log('✅ Web domain allowed:', origin);
    return next();
  }

  console.warn('❌ Blocked Socket.IO origin:', origin);
  return next(new Error('Not allowed by CORS (Socket.IO middleware)'));
});

// ✅ Lưu instance io vào app
app.set('io', io);

// ✅ Socket events
io.on('connection', (socket) => {
  console.log('🔌 New connection:', socket.id);

  // ✅ Join user room
  socket.on('joinUser', (userId) => {
    if (!userId) {
      socket.emit('error', { message: 'User ID is required' });
      return;
    }

    socket.join(userId);
    socket.emit('joinedUser', { userId, socketId: socket.id });
    console.log(`👤 User ${userId} joined room`);
  });

  // ✅ Join admin room
  socket.on('joinAdmin', (adminId) => {
    if (!adminId) {
      socket.emit('error', { message: 'Admin ID is required' });
      return;
    }

    socket.join('admin-room');
    socket.join(adminId);
    socket.emit('joinedAdmin', { adminId, socketId: socket.id });
    console.log(`👑 Admin ${adminId} joined rooms`);
  });

  // ✅ Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, reason);
  });

  // ✅ Handle errors
  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error);
  });
});

// ✅ Server startup
const ip = getLocalIP();
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server is running at:`);
  console.log(`  - Local:   http://localhost:${PORT}/api`);
  console.log(`  - Network: http://${ip}:${PORT}/api`);
  console.log(`📡 Socket.IO is active`);
  console.log(`🌍 Environment: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
});

// ✅ Health check endpoint
app.get(['/api', '/'], (req, res) => {
  res.send(`
    <h2>🚀 Server Status: RUNNING</h2>
    <p><strong>Local:</strong> http://localhost:${PORT}/api</p>
    <p><strong>Network:</strong> http://${ip}:${PORT}/api</p>
    <p><strong>Socket.IO:</strong> ✅ Active</p>
    <p><strong>Environment:</strong> ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}</p>
  `);
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
