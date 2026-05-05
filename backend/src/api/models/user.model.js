import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Auth
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true },

    // Profile
    name: { type: String, required: true },
    username: { type: String, unique: true },
    avatar: { type: String },
    bio: { type: String },

    // Market place Info
    role: {
      type: String,
      enum: ['user', 'seller', 'admin'],
      default: 'user',
    },

    isVerified: { type: Boolean, default: false },

    // Contact Seller
    whatsappNumber: { type: String },

    // Trust system
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Admin
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ email: 1, phone: 1, username: 1 }, { unique: true });

// 🔐 Hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // no next()
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔍 Compare password
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
