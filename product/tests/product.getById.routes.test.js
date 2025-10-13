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

describe('GET /api/products/:id', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fusion-store-test-get-by-id'
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

  it('returns 400 for invalid ObjectId', async () => {
    const res = await request(app).get('/api/products/not-a-valid-id');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid product id');
  });

  it('returns 404 when product not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  it('returns 200 and the product when found', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const created = await ProductModel.create({
      title: 'Found Item',
      description: 'A product we will fetch',
      price: { amount: 250, currency: 'INR' },
      seller: sellerId,
      images: []
    });

    const res = await request(app).get(`/api/products/${created._id.toString()}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product._id).toBe(created._id.toString());
    expect(res.body.product.title).toBe('Found Item');
  });
});
