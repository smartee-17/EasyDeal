import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
<<<<<<< HEAD
    category: { type: String, required: true }, // TODO: String should be change to category id after creating the category model
    images: { type: [String] },
=======
    category: { type: String, required: true },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
        alt: { short: String, standard: String, detailed: String },
      },
    ],
>>>>>>> 7d5f02507bc9b7e15747812fe41e9b69e1f3081b
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
