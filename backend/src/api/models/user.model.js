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
    // Contact Seller
    whatsappNumber: { type: String },

    // Trust system
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Admin
    isBlocked: { type: Boolean, default: false },

    // Verification flags
    isEmailVerified: { type: Boolean, default: false },

    // Verificstion token
    emailVerificationToken: { type: String, select: false },
    emailVerificationTokenExpire: { type: Date, select: false },

    // Password reset
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false } 
    
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

// instance method: safe public view
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationTokenExpire;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;

  return obj;
}

const User = mongoose.model('User', userSchema);

export default User;
