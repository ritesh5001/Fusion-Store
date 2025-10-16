const cart = {
  items: [],
};

function getItems() {
  return cart.items;
}

function findItem(productId) {
  return cart.items.find((item) => item.productId === productId);
}

function upsertItem(productId, quantity) {
  const existing = findItem(productId);
  if (existing) {
    existing.quantity = quantity;
    return existing;
  }

  const newItem = { productId, quantity };
  cart.items.push(newItem);
  return newItem;
}

function removeItem(productId) {
  const index = cart.items.findIndex((item) => item.productId === productId);
  if (index === -1) {
    return false;
  }

  cart.items.splice(index, 1);
  return true;
}

function clearCart() {
  cart.items.length = 0;
}

module.exports = {
  getItems,
  findItem,
  upsertItem,
  removeItem,
  clearCart,
  // Test-only helper to ensure isolation between suites.
  resetCart: clearCart,
};
