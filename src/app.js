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

const allowedOrigins = [
  'http://localhost:8686',
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://nqhit.github.io/JinStore/',
  'https://nqhit.github.io',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ Blocked CORS origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', routes);
app.use(errorHandler);

module.exports = app;
