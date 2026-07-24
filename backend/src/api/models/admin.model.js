import mongoose from 'mongoose';
import User from "./user.model.js";

const adminSchema = new mongoose.Schema({
    permissions: {
        type: [String],
        default: ["*"]
    },

    loginCount: { type: Number, default: 0}

});

adminSchema.pre("save", async function () {
    if (this.isNew) {
        this.isEmailVerified = true;
    }
});

const Admin = User.discriminator("admin", adminSchema);

export default Admin;