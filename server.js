const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const getLocalIP = require('./src/utils/ipNetwork');

const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

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

  if (!isProd) {
    return next();
  }

  if (!origin || origin === 'null' || origin === 'undefined') {
    return next();
  }

  const allowedOrigins = [
    'https://jinstore-api.onrender.com',
    'https://nqhit.github.io',
    'https://nqhit.github.io/JinStore',
  ];

  if (allowedOrigins.includes(origin)) {
    return next();
  }

  return next(new Error('Not allowed by CORS'));
});

// Lưu instance io vào app
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('joinUser', (userId) => {
    socket.join(userId);
    socket.emit('joinedUser', { userId, socketId: socket.id });
  });

  socket.on('joinAdmin', (adminId) => {
    socket.join('admin-room');
    socket.join(adminId);
    socket.emit('joinedAdmin', { adminId, socketId: socket.id });
  });

  socket.on('test-ping', (data) => {
    socket.emit('test-pong', {
      message: 'Server received your ping!',
      timestamp: new Date().toISOString(),
    });
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
  res.send(`Server is running at:<br>
  - Local: http://localhost:${PORT}/api<br>
  - Network: http://${ip}:${PORT}/api<br>
  📡 Socket.IO is active`);
});

app.get('/api/socket-status', (req, res) => {
  res.json({
    status: 'active',
    connectedClients: io.engine.clientsCount,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
