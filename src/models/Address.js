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

module.exports = mongoose.model('Address', AddressSchema);
