const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock imagekit to avoid importing uuid ESM in Jest CJS environment
jest.mock('../src/config/imagekit', () => ({
  upload: jest.fn()
}));

const app = require('../src/app');
const ProductModel = require('../src/models/product.model');

let mongoServer;

describe('GET /api/products', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fusion-store-test-get'
    });
    await ProductModel.syncIndexes();
  });

  afterEach(async () => {
    await ProductModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('returns empty list when no products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [] });
  });

  it('paginates results with skip and limit', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    // insert 5 products
    await ProductModel.insertMany(
      Array.from({ length: 5 }).map((_, i) => ({
        title: `Item ${i + 1}`,
        description: `Desc ${i + 1}`,
        price: { amount: 100 + i, currency: 'INR' },
        seller: sellerId,
        images: []
      }))
    );

    const res = await request(app).get('/api/products').query({ skip: 2, limit: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].title).toBe('Item 3');
    expect(res.body.data[1].title).toBe('Item 4');
  });

  it('filters by price range', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    await ProductModel.insertMany([
      { title: 'Low', description: 'cheap', price: { amount: 50, currency: 'INR' }, seller: sellerId },
      { title: 'Mid', description: 'moderate', price: { amount: 150, currency: 'INR' }, seller: sellerId },
      { title: 'High', description: 'expensive', price: { amount: 300, currency: 'INR' }, seller: sellerId }
    ]);

    const res = await request(app).get('/api/products').query({ minprice: 100, maxprice: 200 });
    expect(res.statusCode).toBe(200);
    const titles = res.body.data.map((p) => p.title).sort();
    expect(titles).toEqual(['Mid']);
  });

  it('searches by q text query', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    await ProductModel.insertMany([
      { title: 'Blue Shirt', description: 'Cotton casual', price: { amount: 500, currency: 'INR' }, seller: sellerId },
      { title: 'Red Pants', description: 'Formal wear', price: { amount: 700, currency: 'INR' }, seller: sellerId }
    ]);

    const res = await request(app).get('/api/products').query({ q: 'Blue' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Blue Shirt');
  });
});
