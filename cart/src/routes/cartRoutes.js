const express = require('express');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:productId', cartController.updateItemQuantity);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
