import "dotenv/config";
import mongoose from "mongoose";
import Admin from "./src/api/models/admin.model.js";

const ADMIN_ACCOUNT = {
  name: process.env.ADMIN_NAME,
  email: process.env.ADMIN_EMAIL?.toLowerCase(),
  password: process.env.ADMIN_PASSWORD,
  phone: process.env.ADMIN_PHONE,

  role: "admin",

  username: process.env.ADMIN_USERNAME || undefined,
  bio: process.env.ADMIN_BIO || undefined,
  whatsappNumber: process.env.ADMIN_WHATSAPP || undefined,

  permissions: ["*"],
};

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("[Admin Seed] Connected to MongoDB");
    console.log("Connected DB:", mongoose.connection.name);

    const existingAdmin = await Admin.findOne({
      email: ADMIN_ACCOUNT.email,
    });

    if (existingAdmin) {
      console.log(
        `[Admin Seed] Admin already exists: ${existingAdmin.email}`
      );
      return;
    }

    const admin = await Admin.create(ADMIN_ACCOUNT);

    console.log(`[Admin Seed] ✅ Admin created: ${admin.email}`);
  } catch (error) {
    console.error("[Admin Seed]", error);
  } finally {
    await mongoose.disconnect();
    console.log("[Admin Seed] Disconnected from MongoDB");
  }
};

runSeed();