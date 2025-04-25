const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Thêm index để tối ưu truy vấn theo user
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true, // Thêm index để tối ưu truy vấn theo product
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} không phải là số nguyên!',
      }, // Đảm bảo rating là số nguyên
    },
    comment: {
      type: String,
      required: true,
      trim: true, // Loại bỏ khoảng trắng thừa
      minlength: [3, 'Bình luận phải có ít nhất 3 ký tự'],
      maxlength: [500, 'Bình luận không được vượt quá 500 ký tự'],
    },
    isApproved: {
      type: Boolean,
      default: false, // Đánh giá cần được duyệt trước khi hiển thị
    },
  },
  { timestamps: true },
);

// Thêm compound index để tối ưu các truy vấn kết hợp
ReviewSchema.index({ product: 1, user: 1 }, { unique: true }); // Mỗi user chỉ được đánh giá một sản phẩm một lần

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
