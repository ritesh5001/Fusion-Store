const express = require('express');
const multer = require('multer');
const productController = require('../controllers/product.controller');
const createAuthMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', createAuthMiddleware(['admin', "s eller"]), upload.array('images', 5), productController.createProduct);

module.exports = router;