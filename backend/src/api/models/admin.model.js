import mongoose from 'mongoose';
import User from "./user.model";

const adminSchema = new mongoose.Schema({
    permissions: {
        type: [String],
        default: ["*"]
    },

    lastLoginAt: { type: Date},
    loginCount: { type: Number, default: 0}

});

adminSchema.pre("save", function (next) {
    if (this.isNew) {
        this.isEmailVerified = true;
    }

    next();
});

const Admin = User.discriminator("admin", adminSchema);

export default Admin;