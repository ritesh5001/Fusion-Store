const express = require('express');
const multer = require('multer');
const productController = require('../controllers/product.controller');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const handleValidationErrors = require('../middlewares/validation.middleware');
const { createProductValidation } = require('../validators/product.validator');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


const maybeAuth = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : createAuthMiddleware(['admin', 'seller']);


router.post(
  '/',
  maybeAuth,
  upload.array('images', 5),
  createProductValidation,
  handleValidationErrors,
  productController.createProduct
);

router.get('/',)

module.exports = router;