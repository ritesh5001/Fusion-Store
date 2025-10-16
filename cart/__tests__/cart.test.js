const request = require('supertest');
const app = require('../src/app');
const cartStore = require('../src/store/cartStore');

jest.mock('../src/services/productService', () => ({
  getProduct: jest.fn(),
  reserveProduct: jest.fn(),
}));

const productService = require('../src/services/productService');

const productMap = new Map();

function setProduct(productId, overrides = {}) {
  productMap.set(productId, {
    id: productId,
    name: `Product ${productId}`,
    price: 100,
    currency: 'USD',
    availableStock: 10,
    ...overrides,
  });
}

beforeEach(() => {
  cartStore.resetCart();
  productMap.clear();

  productService.getProduct.mockImplementation(async (productId) => {
    return productMap.get(productId) ?? null;
  });

  productService.reserveProduct.mockImplementation(async (productId, quantity) => {
    const product = productMap.get(productId);
    if (!product || product.availableStock < quantity) {
      return { success: false };
    }
    return { success: true };
  });
});

describe('Cart API', () => {
  test('POST /cart/items adds an item when stock is sufficient', async () => {
    setProduct('prod-1', { price: 50, availableStock: 5 });

    const response = await request(app)
      .post('/cart/items')
      .send({ productId: 'prod-1', quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      productId: 'prod-1',
      quantity: 2,
      unitPrice: 50,
      lineTotal: 100,
    });
    expect(response.body.subtotal).toBe(100);
    expect(productService.reserveProduct).toHaveBeenCalledWith('prod-1', 2);
  });

  test('POST /cart/items rejects when requested quantity exceeds availability', async () => {
    setProduct('prod-1', { price: 50, availableStock: 1 });

    const response = await request(app)
      .post('/cart/items')
      .send({ productId: 'prod-1', quantity: 2 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Requested quantity exceeds available stock');
    expect(productService.reserveProduct).not.toHaveBeenCalled();
  });

  test('GET /cart recomputes line totals using latest product pricing', async () => {
    setProduct('prod-1', { price: 50, availableStock: 5 });

    await request(app)
      .post('/cart/items')
      .send({ productId: 'prod-1', quantity: 2 })
      .expect(201);

    setProduct('prod-1', { price: 75, availableStock: 5 });

    const response = await request(app).get('/cart').expect(200);

    expect(response.body.items).toEqual([
      {
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 75,
        lineTotal: 150,
        name: 'Product prod-1',
        currency: 'USD',
      },
    ]);
    expect(response.body.subtotal).toBe(150);
  });

  test('PATCH /cart/items/:productId with quantity 0 removes the item', async () => {
    setProduct('prod-1', { price: 50, availableStock: 5 });

    await request(app)
      .post('/cart/items')
      .send({ productId: 'prod-1', quantity: 2 })
      .expect(201);

    const response = await request(app)
      .patch('/cart/items/prod-1')
      .send({ quantity: 0 })
      .expect(200);

    expect(response.body.items).toHaveLength(0);
    expect(response.body.subtotal).toBe(0);
  });

  test('DELETE /cart/items/:productId returns 404 when item is missing', async () => {
    const response = await request(app).delete('/cart/items/prod-1');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Product not found in cart');
  });

  test('DELETE /cart clears all items', async () => {
    setProduct('prod-1', { price: 50, availableStock: 5 });

    await request(app)
      .post('/cart/items')
      .send({ productId: 'prod-1', quantity: 2 })
      .expect(201);

    const response = await request(app).delete('/cart').expect(200);

    expect(response.body.items).toHaveLength(0);
    expect(response.body.subtotal).toBe(0);
  });
});
