import mongoose from 'mongoose';
import { CATEGORY_ENUM } from '../library/constants/category.constants.js';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: {
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
    images: [
      {
        url: { type: String },
        publicId: { type: String },
        alt: { type: String },
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: { type: String, required: true },
    specifications: [
      {
        key: { type: String, required: true },
        label: { type: String },
        value: { type: mongoose.Schema.Types.Mixed, required: true },
      },
    ],
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
