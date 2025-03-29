const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Tên đăng nhập là bắt buộc'],
      unique: true,
      trim: true,
      minlength: [6, 'Tên đăng nhập phải có ít nhất 6 ký tự'],
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
      required: function () {
        return this.authProvider === 'local';
      },
      minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
    },
    phone: {
      type: String,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
    },
    sex: {
      type: String,
      enum: ['nam', 'nu'],
    },
    dateBirth: {
      type: Date,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, trim: true },
      ward: { type: String, trim: true },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
