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

describe('PATCH /api/products/:id (seller) - Update product fields', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fusion-store-test-patch'
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

  it('updates allowed fields (title, description, price) and returns 200', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await ProductModel.create({
      title: 'Old Title',
      description: 'Old Desc',
      price: { amount: 100, currency: 'INR' },
      seller: sellerId,
      images: []
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .send({
        title: 'New Title',
        description: 'New Desc',
        price: { amount: 150, currency: 'USD' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('New Title');
    expect(res.body.data.description).toBe('New Desc');
    expect(res.body.data.price).toMatchObject({ amount: 150, currency: 'USD' });
  });

  it('returns 400 for invalid ObjectId', async () => {
    const res = await request(app)
      .patch('/api/products/not-a-valid-id')
      .send({ title: 'Anything' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid product id');
  });

  it('returns 404 if product not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/products/${fakeId}`)
      .send({ title: 'Missing' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  it('returns 400 when validation fails (e.g., title too short)', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await ProductModel.create({
      title: 'Valid Title',
      description: 'Desc',
      price: { amount: 100, currency: 'INR' },
      seller: sellerId,
      images: []
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .send({ title: 'No' }); // too short, min 3

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('returns 403 when user is not seller/admin (authorization required)', async () => {
    // Depending on middleware, you might mock an auth failure; since our app bypasses auth in tests, this serves as a placeholder.
    // When implementing, ensure the auth middleware enforces seller/admin roles and return 403 accordingly.
  });
});
