import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    slug: { type: String },
  },
  { timestamps: true },
);

tagSchema.pre('save', function () {
  this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
});

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;
