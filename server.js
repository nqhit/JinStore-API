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
  'http://localhost:5173',
];

// ✅ Cấu hình CORS linh hoạt cho React Native và Web
const io = new Server(server, {
  cors: {
    origin: isProd ? allowedOrigins : true, // Dev mode: allow all
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
  allowUpgrades: true,
  upgradeTimeout: 30000,
});

io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;

  if (!isProd) {
    console.log('🔧 Dev mode - allowing all connections');
    return next();
  }

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

  if (allowedOrigins.includes(origin)) {
    return next();
  }

  return next(new Error('Not allowed by CORS (Socket.IO middleware)'));
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('joinUser', (userId) => {
    if (!userId) {
      socket.emit('error', { message: 'User ID is required' });
      return;
    }

    socket.join(userId);
    socket.emit('joinedUser', { userId, socketId: socket.id });
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
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, reason);
  });

  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error);
  });
});

const ip = getLocalIP();
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server is running at:`);
  console.log(`  - Local:   http://localhost:${PORT}/api`);
  console.log(`  - Network: http://${ip}:${PORT}/api`);
  console.log(`📡 Socket.IO is active`);
  console.log(`🌍 Environment: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
});

app.get(['/api', '/'], (req, res) => {
  res.send(`
    <h2>🚀 Server Status: RUNNING</h2>
    <p><strong>Local:</strong> http://localhost:${PORT}/api</p>
    <p><strong>Network:</strong> http://${ip}:${PORT}/api</p>
    <p><strong>Socket.IO:</strong> ✅ Active</p>
    <p><strong>Environment:</strong> ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}</p>
  `);
});

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
