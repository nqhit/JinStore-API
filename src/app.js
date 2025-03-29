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

app.use(
  cors({
    origin: 'http://localhost:5173' || process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Define routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
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
