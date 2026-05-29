import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String },
  },
  { timestamps: true },
);

categorySchema.pre('save', async function () {
  this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
