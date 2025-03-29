const mongoose = require('mongoose');

const connectDB = async () => {
  console.log('🔍 DATABASE_URL từ process.env:', process.env.DATABASE_URL); // Debug

  const DATABASE_URL = process.env.DATABASE_URL; // Kiểm tra tên biến

  if (!DATABASE_URL) {
    console.error('❌ Không tìm thấy DATABASE_URL! Vui lòng kiểm tra file .env.');
    process.exit(1);
  }

  try {
    await mongoose
      .connect(DATABASE_URL)
      .then(() => console.log('MongoDB connected successfully'))
      .catch((err) => console.error('MongoDB connection error:', err));

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
