const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock imagekit to avoid any external calls
jest.mock('../src/config/imagekit', () => ({
  upload: jest.fn()
}));

const app = require('../src/app');
const ProductModel = require('../src/models/product.model');

let mongoServer;

describe('GET /api/products/seller (seller) - List products by seller', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fusion-store-test-get-seller'
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

  it('returns empty list when seller has no products', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get('/api/products/seller')
      .query({ seller: sellerId.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [] });
  });

  it('lists only products for the specified seller', async () => {
    const sellerA = new mongoose.Types.ObjectId();
    const sellerB = new mongoose.Types.ObjectId();

    await ProductModel.insertMany([
      { title: 'A1', description: 'A', price: { amount: 10, currency: 'INR' }, seller: sellerA },
      { title: 'A2', description: 'A', price: { amount: 20, currency: 'INR' }, seller: sellerA },
      { title: 'B1', description: 'B', price: { amount: 30, currency: 'INR' }, seller: sellerB }
    ]);

    const res = await request(app)
      .get('/api/products/seller')
      .query({ seller: sellerA.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const titles = res.body.data.map((p) => p.title).sort();
    expect(titles).toEqual(['A1', 'A2']);
  });

  it('supports pagination via skip and limit', async () => {
    const seller = new mongoose.Types.ObjectId();

    await ProductModel.insertMany(
      Array.from({ length: 5 }).map((_, i) => ({
        title: `P${i + 1}`,
        description: 'X',
        price: { amount: i * 10, currency: 'INR' },
        seller
      }))
    );

    const res = await request(app)
      .get('/api/products/seller')
      .query({ seller: seller.toString(), skip: 2, limit: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].title).toBe('P3');
    expect(res.body.data[1].title).toBe('P4');
  });

  it('returns 400 for missing or invalid seller id', async () => {
    const res1 = await request(app)
      .get('/api/products/seller')
      .query({ });
    expect(res1.statusCode).toBe(400);

    const res2 = await request(app)
      .get('/api/products/seller')
      .query({ seller: 'not-an-id' });
    expect(res2.statusCode).toBe(400);
  });
});
