const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middlewares/errorMiddleware');
const routes = require('./routes');

require('dotenv').config();
connectDB();

const app = express();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

const allowedOrigins = [
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
        console.log('CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/api', (req, res) => {
  res.send('JinStore API is running...');
});

app.use(errorHandler);

module.exports = app;
