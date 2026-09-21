import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import User from '../src/api/models/user.model.js';
import Product from '../src/api/models/product.model.js';
import Tag from '../src/api/models/tag.model.js';

/* ── Safety ─────────────────────────────────────────────── */
const mongoUri = process.env.MONGO_URI || '';
if (!mongoUri.includes('127.0.0.1') && !mongoUri.includes('localhost')) {
  console.error('[Test Seed] ABORT: MONGO_URI does not point to localhost.');
  process.exit(1);
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error('[Test Seed] ABORT: Cloudinary env vars not set.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CF = 'EasyDeal/test-seed';

/* ── Helpers ────────────────────────────────────────────── */
async function dl(url, name) {
  const p = path.join(os.tmpdir(), name);
  const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
  await fs.writeFile(p, r.data);
  return p;
}

async function uploadImg(localPath, pubId) {
  const res = await cloudinary.uploader.upload(localPath, {
    folder: CF, public_id: pubId, overwrite: false, resource_type: 'image',
  });
  return { url: res.secure_url, publicId: res.public_id };
}

async function rm(p) { try { await fs.unlink(p); } catch {} }

/* ── Data ───────────────────────────────────────────────── */
const PW = 'TestPass123!';

const USERS = [
  { name: 'Amara Obi', email: 'seed.user1@easydeal.test', phone: '08011111111', username: 'seed_amara' },
  { name: 'Tunde Bakare', email: 'seed.user2@easydeal.test', phone: '08022222222', username: 'seed_tunde' },
  { name: 'Nneka Eze', email: 'seed.user3@easydeal.test', phone: '08033333333', username: 'seed_nneka' },
  { name: 'Emeka Nwosu', email: 'seed.user4@easydeal.test', phone: '08044444444', username: 'seed_emeka' },
  { name: 'Fatima Abubakar', email: 'seed.user5@easydeal.test', phone: '08055555555', username: 'seed_fatima' },
];

const AVATARS = [
  'https://i.pravatar.cc/300?img=1',
  'https://i.pravatar.cc/300?img=2',
  'https://i.pravatar.cc/300?img=3',
  'https://i.pravatar.cc/300?img=4',
  'https://i.pravatar.cc/300?img=5',
];

const PRODUCTS = [
  {
    title: 'MacBook Pro 14-inch',
    description: 'Apple MacBook Pro 14-inch with M3 Pro chip, 18GB RAM, 512GB SSD. Excellent condition.',
    price: 1200000, category: 'electronics', location: 'Lagos, Nigeria',
    specs: [
      { key: 'brand', label: 'Brand', value: 'Apple' },
      { key: 'type', label: 'Type', value: 'Laptop' },
      { key: 'ram', label: 'RAM', value: '16GB' },
      { key: 'storage', label: 'Storage', value: '512GB' },
      { key: 'condition', label: 'Condition', value: 'Used - Like new' },
    ],
    tagNames: ['laptop', 'apple', 'macbook'],
    imgUrl: 'https://placehold.co/600x400/1a1a2e/eeeeee?text=MacBook+Pro',
    imgName: 'product-laptop.png',
  },
  {
    title: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung Galaxy S24 Ultra, 256GB, Titanium Black. Brand new sealed in box.',
    price: 850000, category: 'electronics', location: 'Abuja, Nigeria',
    specs: [
      { key: 'brand', label: 'Brand', value: 'Samsung' },
      { key: 'type', label: 'Type', value: 'Phone' },
      { key: 'storage', label: 'Storage', value: '256GB' },
      { key: 'condition', label: 'Condition', value: 'New' },
    ],
    tagNames: ['samsung', 'galaxy', 'smartphone'],
    imgUrl: 'https://placehold.co/600x400/0f3460/eeeeee?text=Galaxy+S24',
    imgName: 'product-phone.png',
  },
  {
    title: 'Herman Miller Ergonomic Chair',
    description: 'Premium ergonomic office chair with lumbar support and breathable mesh back.',
    price: 185000, category: 'furniture', location: 'Port Harcourt, Nigeria',
    specs: [
      { key: 'material', label: 'Material', value: 'Mesh' },
      { key: 'dimensions', label: 'Dimensions', value: '65x65x120 cm' },
      { key: 'color', label: 'Color', value: 'Black' },
      { key: 'condition', label: 'Condition', value: 'New' },
    ],
    tagNames: ['chair', 'office', 'ergonomic'],
    imgUrl: 'https://placehold.co/600x400/2d4059/eeeeee?text=Office+Chair',
    imgName: 'product-chair.png',
  },
  {
    title: 'Nike Air Max 270',
    description: 'Nike Air Max 270 running shoes. Size 42, brand new with original tags.',
    price: 65000, category: 'clothing', location: 'Lagos, Nigeria',
    specs: [
      { key: 'brand', label: 'Brand', value: 'Nike' },
      { key: 'size', label: 'Size', value: '42' },
      { key: 'color', label: 'Color', value: 'Black/White' },
      { key: 'gender', label: 'Gender', value: 'Men' },
      { key: 'condition', label: 'Condition', value: 'New with tags' },
    ],
    tagNames: ['nike', 'sneakers', 'airmax'],
    imgUrl: 'https://placehold.co/600x400/222831/eeeeee?text=Nike+Air+Max',
    imgName: 'product-sneakers.png',
  },
  {
    title: 'Osprey Daylite Plus Backpack',
    description: 'Osprey Daylite Plus daypack, 20L capacity. Perfect for daily commute.',
    price: 45000, category: 'other', location: 'Ibadan, Nigeria',
    specs: [
      { key: 'brand', label: 'Brand', value: 'Osprey' },
      { key: 'material', label: 'Material', value: 'Ripstop Nylon' },
      { key: 'dimensions', label: 'Dimensions', value: '46x28x23 cm' },
      { key: 'condition', label: 'Condition', value: 'New' },
    ],
    tagNames: ['backpack', 'osprey', 'travel'],
    imgUrl: 'https://placehold.co/600x400/393e46/eeeeee?text=Backpack',
    imgName: 'product-backpack.png',
  },
];

/* ── Main ───────────────────────────────────────────────── */
async function run() {
  console.log('[Test Seed] Starting...');
  await mongoose.connect(mongoUri);
  console.log('[Test Seed] Connected to MongoDB:', mongoose.connection.name);

  const stats = { usersCreated: 0, usersReused: 0, productsCreated: 0, productsReused: 0, tagsCreated: 0, imagesUploaded: 0 };

  // --- Users ---
  console.log('\n[Test Seed] Seeding users...');
  const createdUsers = [];
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    let user = await User.findOne({ email: u.email });
    if (user) {
      console.log(`  Reused: ${u.email}`);
      stats.usersReused++;
      createdUsers.push(user);
      continue;
    }

    const avatarTmp = await dl(AVATARS[i], `avatar-${i}.jpg`);
    let avatarData = {};
    try {
      avatarData = await uploadImg(avatarTmp, `avatar-user${i + 1}`);
      stats.imagesUploaded++;
      console.log(`  Uploaded avatar for ${u.name}`);
    } catch (e) {
      console.warn(`  Avatar upload failed for ${u.name}:`, e.message);
    } finally {
      await rm(avatarTmp);
    }

    user = await User.create({
      name: u.name,
      email: u.email,
      phone: u.phone,
      username: u.username,
      password: PW,
      role: 'seller',
      isEmailVerified: true,
      avatar: avatarData.url ? { url: avatarData.url, publicId: avatarData.publicId } : undefined,
    });
    console.log(`  Created: ${u.email} (${user._id})`);
    stats.usersCreated++;
    createdUsers.push(user);
  }

  // --- Tags ---
  console.log('\n[Test Seed] Seeding tags...');
  const allTagNames = [...new Set(PRODUCTS.flatMap(p => p.tagNames))];
  const tagMap = {};
  for (const name of allTagNames) {
    let tag = await Tag.findOne({ name });
    if (!tag) {
      tag = await Tag.create({ name });
      stats.tagsCreated++;
    }
    tagMap[name] = tag._id;
  }
  console.log(`  ${Object.keys(tagMap).length} tags ready (${stats.tagsCreated} created)`);

  // --- Products ---
  console.log('\n[Test Seed] Seeding products...');
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const seller = createdUsers[i];
    let product = await Product.findOne({ title: p.title, seller: seller._id });
    if (product) {
      console.log(`  Reused: "${p.title}"`);
      stats.productsReused++;
      continue;
    }

    const imgTmp = await dl(p.imgUrl, p.imgName);
    let imageData = {};
    try {
      imageData = await uploadImg(imgTmp, `product-${i + 1}`);
      stats.imagesUploaded++;
      console.log(`  Uploaded image for "${p.title}"`);
    } catch (e) {
      console.warn(`  Image upload failed for "${p.title}":`, e.message);
    } finally {
      await rm(imgTmp);
    }

    product = await Product.create({
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      location: p.location,
      seller: seller._id,
      isAvailable: true,
      specifications: p.specs,
      tags: p.tagNames.map(n => tagMap[n]),
      images: imageData.url ? [{ url: imageData.url, publicId: imageData.publicId, alt: p.title }] : [],
    });
    console.log(`  Created: "${p.title}" (${product._id})`);
    stats.productsCreated++;
  }

  // --- Summary ---
  console.log('\n═══════════════════════════════════════════');
  console.log('[Test Seed] DONE');
  console.log(`  Users:      ${stats.usersCreated} created, ${stats.usersReused} reused`);
  console.log(`  Products:   ${stats.productsCreated} created, ${stats.productsReused} reused`);
  console.log(`  Tags:       ${stats.tagsCreated} created`);
  console.log(`  Images:     ${stats.imagesUploaded} uploaded to Cloudinary`);
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('[Test Seed] Disconnected from MongoDB.');
}

run().catch(e => {
  console.error('[Test Seed] Fatal error:', e);
  process.exit(1);
});
