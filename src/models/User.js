const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  phone: { type: String },
  address: {
    street: String,
    city: String,
    district: String,
    ward: String
  },
  role: { type: String, enum: ["customer", "admin"], default: "customer" }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
