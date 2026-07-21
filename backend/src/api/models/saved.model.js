import mongoose from 'mongoose';

const savedSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

savedSchema.index({ productId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Saved', savedSchema);
