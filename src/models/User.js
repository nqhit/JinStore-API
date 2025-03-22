const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Tên đăng nhập là bắt buộc'],
      unique: true,
      trim: true, // Loại bỏ khoảng trắng thừa
      minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
    },
    fullname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không đúng định dạng'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    },
    phone: {
      type: String,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, trim: true },
      ward: { type: String, trim: true },
    },
    role: {
      type: Boolean,
      default: false, // false: user thường, true: admin
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
