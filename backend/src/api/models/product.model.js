import mongoose from 'mongoose';
import { CATEGORY_ENUM } from '../library/constants/category.constants.js';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: {
<<<<<<< HEAD
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
=======
      type: String,
      enum: CATEGORY_ENUM,
      required: true,
    },
    tags: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
      validate: {
        validator: (val) => val.length <= 5,
        message: 'A post can have a maximum of 5 tags',
      },
      default: [],
    },
>>>>>>> 19f8c752c7439a1e2d1256921bd63921916910f5
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
