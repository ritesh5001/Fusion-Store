const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../src/config/imagekit', () => ({
  upload: jest.fn()
}));

const imagekit = require('../src/config/imagekit');
const app = require('../src/app');
const Product = require('../src/models/product.model');

let mongoServer;

describe('POST /api/products', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fusion-store-test'
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('creates a product with uploaded images', async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();

    imagekit.upload.mockResolvedValueOnce({
      url: 'https://test.imagekit.io/fake-image.jpg',
      thumbnailUrl: 'https://test.imagekit.io/fake-image-thumb.jpg',
      fileId: 'file_fake_123'
    });

    const response = await request(app)
      .post('/api/products')
      .field('title', 'Test Product')
      .field('price', JSON.stringify({ amount: 1999, currency: 'INR' }))
      .field('seller', sellerId)
      .attach('images', Buffer.from('fake image binary'), 'product.jpg');

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      message: 'Product created successfully'
    });

    const { data } = response.body;
    expect(data).toMatchObject({
      title: 'Test Product',
      seller: sellerId,
      price: {
        amount: 1999,
        currency: 'INR'
      }
    });
    expect(data.images).toHaveLength(1);
    expect(data.images[0]).toMatchObject({
      url: 'https://test.imagekit.io/fake-image.jpg',
      thumbnail: 'https://test.imagekit.io/fake-image-thumb.jpg',
      id: 'file_fake_123'
    });

    expect(imagekit.upload).toHaveBeenCalledTimes(1);
    expect(imagekit.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'product.jpg'
      })
    );

    const productInDb = await Product.findById(data._id).lean();
    expect(productInDb).toBeTruthy();
    expect(productInDb.title).toBe('Test Product');
    expect(productInDb.price.amount).toBe(1999);
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/products')
      .field('price', JSON.stringify({ amount: 1999 }))
      .attach('images', Buffer.from('fake image binary'), 'product.jpg');

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
    expect(imagekit.upload).not.toHaveBeenCalled();
  });

  it('returns 400 when price payload is invalid JSON', async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post('/api/products')
      .field('title', 'Broken Price Product')
      .field('price', '{bad-json')
      .field('seller', sellerId);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Invalid price format. Expected JSON string.');
    expect(imagekit.upload).not.toHaveBeenCalled();
  });
});
