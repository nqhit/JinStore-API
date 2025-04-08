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
  },
  { timestamps: true }, // Bỏ _id: false vì đã định nghĩa _id thủ công
);

const generateUniqueSlug = async (model, name) => {
  try {
    let baseSlug = slugify(name, { lower: true, strict: true });
    const existingSlugs = await model
      .find({ slug: new RegExp(`^${baseSlug}(-\\d+)?$`) })
      .select('slug')
      .lean();

    if (!existingSlugs.length) return baseSlug;

    const counters = existingSlugs
      .map((doc) => {
        const match = doc.slug.match(new RegExp(`${baseSlug}-(\\d+)$`));
        return match ? parseInt(match[1]) : 0;
      })
      .filter((num) => !isNaN(num));

    const nextCounter = counters.length ? Math.max(...counters) + 1 : 1;
    return `${baseSlug}-${nextCounter}`;
  } catch (error) {
    throw new Error('Lỗi khi tạo slug: ' + error.message);
  }
};

categorySchema.pre('save', async function (next) {
  try {
    if (this.isNew || this.isModified('name')) {
      this.slug = await generateUniqueSlug(this.constructor, this.name);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Category', categorySchema);
