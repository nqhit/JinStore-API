const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    _idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    //Đường
    street: { type: String, trim: true },
    //Phường/Xã
    ward: { type: String, trim: true },
    //Quận/Huyện
    district: { type: String, trim: true },
    //Tỉnh/Thành phố
    city: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);
// Index để tối ưu truy vấn tìm kiếm theo người dùng
AddressSchema.index({ _idUser: 1 });

// Index để tối ưu truy vấn tìm địa chỉ mặc định của người dùng
AddressSchema.index({ _idUser: 1, isDefault: 1 });

module.exports = mongoose.model('Address', AddressSchema);
