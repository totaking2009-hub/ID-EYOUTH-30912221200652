require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

const CATEGORY_NAMES = ['Music', 'Tech', 'Sports'];

async function upsertCategories() {
  const categories = {};
  for (const name of CATEGORY_NAMES) {
    // findOneAndUpdate with upsert keeps this script safe to run twice.
    const cat = await Category.findOneAndUpdate(
      { name },
      { name, description: `${name} related events` },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categories[name] = cat;
  }
  return categories;
}

async function upsertAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@eventpulse.com').toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 12);
  return User.create({
    name: 'EventPulse Admin',
    email,
    password: hashed,
    role: 'admin',
  });
}

async function upsertEvents(categories, admin) {
  const sampleEvents = [
    {
      name: 'Summer Beats Festival',
      description: 'An open-air music festival featuring local and international artists.',
      category: categories.Music._id,
      city: 'Cairo',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      capacity: 500,
    },
    {
      name: 'DevConnect Summit',
      description: 'A one-day conference on backend architecture and cloud deployment.',
      category: categories.Tech._id,
      city: 'Alexandria',
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      capacity: 200,
    },
    {
      name: 'City Marathon',
      description: 'A 10K and 21K run through the city center, open to all skill levels.',
      category: categories.Sports._id,
      city: 'Mansoura',
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      capacity: 1000,
    },
  ];

  for (const evt of sampleEvents) {
    await Event.findOneAndUpdate(
      { name: evt.name },
      { ...evt, createdBy: admin._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function run() {
  await connectDB();

  const categories = await upsertCategories();
  const admin = await upsertAdmin();
  await upsertEvents(categories, admin);

  console.log('[Seed] Categories, admin user, and sample events are in place.');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
