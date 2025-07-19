const cors = require('cors');
const routes = require('./routes');
const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const passportSetup = require('./config/passport');
const { errorHandler } = require('./middlewares/errorMiddleware');

require('dotenv').config();
connectDB();

const app = express();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// CORS configuration cho production
const allowedOrigins = [
  'http://localhost:8686',
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8686',
  'https://your-frontend-domain.onrender.com', // Thay bằng domain thực tế của bạn
  'https://your-frontend-domain.vercel.app', // Thay bằng domain thực tế của bạn
  process.env.CLIENT_URL_V1, // Từ environment variable
  process.env.CLIENT_URL_V2, // Từ environment variable
].filter(Boolean); // Loại bỏ các giá trị undefined

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ Blocked CORS origin:', origin);
        console.log('✅ Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json());
app.use(cookieParser());

// Session configuration cho production
const isProduction = process.env.NODE_ENV === 'production';
const isSecure = isProduction && process.env.SECURE_COOKIES !== 'false';

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isSecure,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    },
    name: 'sessionId', // Tên cookie session
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', routes);
app.use(errorHandler);

module.exports = app;
