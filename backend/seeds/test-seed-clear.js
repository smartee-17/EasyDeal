import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

import User from '../src/api/models/user.model.js';
import Product from '../src/api/models/product.model.js';
import Tag from '../src/api/models/tag.model.js';

/* ── Safety ─────────────────────────────────────────────── */
const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
  console.error('[Test Seed Clear] ABORT: MONGO_URI does not point to localhost.');
  process.exit(1);
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error('[Test Seed Clear] ABORT: Cloudinary env vars not set.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SEED_EMAILS = [
  'seed.user1@easydeal.test',
  'seed.user2@easydeal.test',
  'seed.user3@easydeal.test',
  'seed.user4@easydeal.test',
  'seed.user5@easydeal.test',
];

const SEED_TAG_NAMES = [
  'laptop', 'apple', 'macbook',
  'samsung', 'galaxy', 'smartphone',
  'chair', 'office', 'ergonomic',
  'nike', 'sneakers', 'airmax',
  'backpack', 'osprey', 'travel',
];

async function destroyCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  console.log('[Test Seed Clear] Starting...');
  await mongoose.connect(mongoUri);
  console.log('[Test Seed Clear] Connected to MongoDB:', mongoose.connection.name);

  const stats = { usersDeleted: 0, productsDeleted: 0, tagsDeleted: 0, cloudinaryDestroyed: 0 };

  // --- Find test users ---
  const testUsers = await User.find({ email: { $in: SEED_EMAILS } });
  const testUserIds = testUsers.map(u => u._id);

  // --- Delete product images from Cloudinary ---
  const testProducts = await Product.find({ seller: { $in: testUserIds } });
  for (const p of testProducts) {
    for (const img of (p.images || [])) {
      if (img.publicId && img.publicId.includes('EasyDeal/test-seed')) {
        if (await destroyCloudinary(img.publicId)) {
          stats.cloudinaryDestroyed++;
        }
      }
    }
  }

  // --- Delete products ---
  const prodResult = await Product.deleteMany({ seller: { $in: testUserIds } });
  stats.productsDeleted = prodResult.deletedCount;

  // --- Delete user avatars from Cloudinary ---
  for (const u of testUsers) {
    if (u.avatar && u.avatar.publicId && u.avatar.publicId.includes('EasyDeal/test-seed')) {
      if (await destroyCloudinary(u.avatar.publicId)) {
        stats.cloudinaryDestroyed++;
      }
    }
  }

  // --- Delete users ---
  const userResult = await User.deleteMany({ email: { $in: SEED_EMAILS } });
  stats.usersDeleted = userResult.deletedCount;

  // --- Delete test tags ---
  const tagResult = await Tag.deleteMany({ name: { $in: SEED_TAG_NAMES } });
  stats.tagsDeleted = tagResult.deletedCount;

  // --- Summary ---
  console.log('\n═══════════════════════════════════════════');
  console.log('[Test Seed Clear] DONE');
  console.log(`  Users:            ${stats.usersDeleted} deleted`);
  console.log(`  Products:         ${stats.productsDeleted} deleted`);
  console.log(`  Tags:             ${stats.tagsDeleted} deleted`);
  console.log(`  Cloudinary assets: ${stats.cloudinaryDestroyed} destroyed`);
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('[Test Seed Clear] Disconnected from MongoDB.');
}

run().catch(e => {
  console.error('[Test Seed Clear] Fatal error:', e);
  process.exit(1);
});
