const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middlewares/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
// const orderRoutes = require("./routes/orderRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
// const reviewRoutes = require("./routes/reviewRoutes");
const discountRoutes = require('./routes/discountRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
// const wishlistRoutes = require("./routes/wishlistRoutes");
const verifyOTPRoutes = require('./routes/verifyOTPRoutes');

const app = express();
require('dotenv').config();
connectDB();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Update allowed origins to include all possible frontend URLs
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

// Define routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
// app.use("/orders", orderRoutes);
app.use('/products', productRoutes);
// app.use("/payments", paymentRoutes);
// app.use("/reviews", reviewRoutes);
app.use('/discounts', discountRoutes);
app.use('/categories', categoryRoutes);
// app.use("/wishlist", wishlistRoutes);
app.use('/otp', verifyOTPRoutes);

app.get('/', (req, res) => {
  res.send('JinStore API is running...');
});

app.use(errorHandler);

module.exports = app;
