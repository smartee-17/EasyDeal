import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
        alt: { short: String, standard: String, detailed: String },
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.pre('save', function () {
  if (this.price < 0) {
    throw new Error('Price cannot be negative');
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
