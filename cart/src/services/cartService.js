const cartStore = require('../store/cartStore');
const productService = require('./productService');
const { ValidationError, NotFoundError } = require('../errors/ApiError');

function assertProductId(productId) {
  if (!productId || typeof productId !== 'string') {
    throw new ValidationError('productId is required');
  }
}

function parseQuantity(quantity, { allowZero = false } = {}) {
  const parsed = Number(quantity);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new ValidationError('quantity must be an integer');
  }
  if (!allowZero && parsed <= 0) {
    throw new ValidationError('quantity must be greater than zero');
  }
  if (allowZero && parsed < 0) {
    throw new ValidationError('quantity must be zero or greater');
  }
  return parsed;
}

function ensureAvailability(product, requestedQuantity) {
  if (product.availableStock == null) {
    return;
  }
  if (requestedQuantity > product.availableStock) {
    throw new ValidationError('Requested quantity exceeds available stock');
  }
}

async function reserveDelta(productId, quantityDelta) {
  if (quantityDelta <= 0) {
    return;
  }
  if (typeof productService.reserveProduct !== 'function') {
    return;
  }

  const result = await productService.reserveProduct(productId, quantityDelta);
  if (result && result.success === false) {
    throw new ValidationError('Unable to reserve stock for product');
  }
}

async function getCart() {
  const persistedItems = [...cartStore.getItems()];
  const recalculatedItems = [];

  // Always fetch fresh product data so cart totals cannot be tampered with client-side.
  for (const item of persistedItems) {
    const product = await productService.getProduct(item.productId);

    if (!product) {
      cartStore.removeItem(item.productId);
      continue;
    }

    const unitPrice = Number(product.price);
    if (!Number.isFinite(unitPrice)) {
      throw new ValidationError('Product price is unavailable');
    }

    const lineTotal = unitPrice * item.quantity;

    recalculatedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      name: product.name,
      currency: product.currency,
    });
  }

  const subtotal = recalculatedItems.reduce((sum, current) => sum + current.lineTotal, 0);

  return {
    items: recalculatedItems,
    subtotal,
  };
}

async function addItem(productId, quantity) {
  assertProductId(productId);
  const parsedQuantity = parseQuantity(quantity);

  const product = await productService.getProduct(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const existing = cartStore.findItem(productId);
  const targetQuantity = existing ? existing.quantity + parsedQuantity : parsedQuantity;

  ensureAvailability(product, targetQuantity);
  await reserveDelta(productId, parsedQuantity);

  cartStore.upsertItem(productId, targetQuantity);

  return getCart();
}

async function updateItemQuantity(productId, quantity) {
  assertProductId(productId);
  const existing = cartStore.findItem(productId);

  if (!existing) {
    throw new NotFoundError('Product not found in cart');
  }

  const parsedQuantity = parseQuantity(quantity, { allowZero: true });

  if (parsedQuantity === 0) {
    cartStore.removeItem(productId);
    return getCart();
  }

  const product = await productService.getProduct(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  ensureAvailability(product, parsedQuantity);

  const delta = parsedQuantity - existing.quantity;
  await reserveDelta(productId, delta);

  cartStore.upsertItem(productId, parsedQuantity);

  return getCart();
}

async function removeItem(productId) {
  assertProductId(productId);
  const removed = cartStore.removeItem(productId);
  if (!removed) {
    throw new NotFoundError('Product not found in cart');
  }
  return getCart();
}

async function clearCart() {
  cartStore.clearCart();
  return getCart();
}

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
