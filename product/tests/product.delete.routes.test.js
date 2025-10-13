const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock imagekit to avoid external calls
jest.mock('../src/config/imagekit', () => ({
  upload: jest.fn()
}));

const app = require('../src/app');
const ProductModel = require('../src/models/product.model');

let mongoServer;

describe('DELETE /api/products/:id (seller) - Delete product', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fusion-store-test-delete'
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
    const res = await request(app).delete('/api/products/not-a-valid-id');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid product id');
  });

  it('returns 404 when product does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/products/${fakeId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  it('deletes existing product and returns 200', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await ProductModel.create({
      title: 'To Delete',
      description: 'will be removed',
      price: { amount: 99, currency: 'INR' },
      seller: sellerId,
      images: []
    });

    const res = await request(app).delete(`/api/products/${product._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const exists = await ProductModel.findById(product._id);
    expect(exists).toBeNull();
  });

  it('returns 403 when user is not seller/admin (authorization required)', async () => {
    // Placeholder until auth is enforced in tests.
  });
});
