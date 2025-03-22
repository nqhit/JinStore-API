const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
// const orderRoutes = require("./routes/orderRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
// const reviewRoutes = require("./routes/reviewRoutes");
// const couponRoutes = require("./routes/couponRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
// const wishlistRoutes = require("./routes/wishlistRoutes");
const logger = require('./config/logger');

const { errorHandler } = require('./middlewares/errorMiddleware');
const app = express();
require('dotenv').config();

connectDB();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use(cors({ credentials: true }));
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
// app.use("/coupons", couponRoutes);
app.use('/categories', categoryRoutes);
// app.use("/wishlist", wishlistRoutes);

app.get('/', (req, res) => {
  res.send('JinStore API is running...');
});

app.use(errorHandler);

module.exports = app;
