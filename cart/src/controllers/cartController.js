const cartService = require('../services/cartService');
const asyncHandler = require('../utils/asyncHandler');

function respondWithCart(res, cart, status = 200) {
  return res.status(status).json(cart);
}

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart();
  respondWithCart(res, cart);
});

exports.addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addItem(productId, quantity);
  respondWithCart(res, cart, 201);
});

exports.updateItemQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await cartService.updateItemQuantity(req.params.productId, quantity);
  respondWithCart(res, cart);
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.params.productId);
  respondWithCart(res, cart);
});

exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart();
  respondWithCart(res, cart);
});
