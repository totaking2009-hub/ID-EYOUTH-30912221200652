const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
process.env.NODE_ENV = 'test';

const app = require('../app');
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

let mongod;
let adminToken;
let categoryId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const hashed = await bcrypt.hash('Admin@12345', 12);
  await User.create({ name: 'Admin', email: 'admin@test.com', password: hashed, role: 'admin' });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@12345' });
  adminToken = login.body.token;

  const category = await Category.create({ name: 'Tech' });
  categoryId = category._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  await Event.deleteMany({});
});

describe('Events API', () => {
  test('creates an event as admin (success case)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'DevConnect Summit',
        description: 'A backend architecture conference',
        category: categoryId,
        city: 'Cairo',
        date: new Date(Date.now() + 86400000).toISOString(),
        capacity: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.event.name).toBe('DevConnect Summit');
    expect(res.body.data.event.category._id).toBe(categoryId);
  });

  test('rejects event creation without a token (failure case)', async () => {
    const res = await request(app).post('/api/events').send({ name: 'No Auth Event' });
    expect(res.status).toBe(401);
  });

  test('rejects event creation with invalid data (validation case)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' });

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('lists events and filters by city', async () => {
    await Event.create([
      {
        name: 'Cairo Event',
        description: 'desc',
        category: categoryId,
        city: 'Cairo',
        date: new Date(),
        capacity: 10,
        createdBy: new mongoose.Types.ObjectId(),
      },
      {
        name: 'Giza Event',
        description: 'desc',
        category: categoryId,
        city: 'Giza',
        date: new Date(),
        capacity: 10,
        createdBy: new mongoose.Types.ObjectId(),
      },
    ]);

    const res = await request(app).get('/api/events').query({ city: 'Cairo' });

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data.events[0].city).toBe('Cairo');
  });
});
