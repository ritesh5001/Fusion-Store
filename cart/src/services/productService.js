const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

function ensureFetchAvailable() {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch API is not available. Upgrade to Node 18+ or polyfill fetch.');
  }
}

function buildUrl(path) {
  const trimmedBase = PRODUCT_SERVICE_URL.endsWith('/')
    ? PRODUCT_SERVICE_URL.slice(0, -1)
    : PRODUCT_SERVICE_URL;
  return `${trimmedBase}${path}`;
}

async function parseJsonSafely(response) {
  if (response.status === 204) {
    return {};
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function getProduct(productId) {
  ensureFetchAvailable();
  const response = await fetch(buildUrl(`/products/${productId}`));

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  return parseJsonSafely(response);
}

async function reserveProduct(productId, quantity) {
  ensureFetchAvailable();

  const response = await fetch(buildUrl(`/products/${productId}/reserve`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });

  if (response.status === 409) {
    return { success: false };
  }

  if (!response.ok) {
    throw new Error(`Failed to reserve product: ${response.status}`);
  }

  const payload = await parseJsonSafely(response);
  if (typeof payload.success === 'undefined') {
    payload.success = true;
  }
  return payload;
}

module.exports = {
  getProduct,
  reserveProduct,
};
