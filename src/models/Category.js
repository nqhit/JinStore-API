const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    isOutstanding: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    image: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true, _id: false },
);

// Tạo slug tự động trước khi lưu vào DB
categorySchema.pre('save', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
