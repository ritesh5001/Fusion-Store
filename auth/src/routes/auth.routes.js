const express = require('express');
const validators = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller')
const addressController = require('../controllers/address.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/register',validators.registerUserValidations,authController.registerUser);

router.post('/login', validators.loginUserValidations,authController.loginUser);

router.get('/me', authMiddleware.authMiddleware, authController.getCurrentUser)

router.get('/logout', authController.logoutUser);

router.get('/user/me/addresses', authMiddleware.authMiddleware, addressController.getUserAddresses);

router.post(
	'/user/me/addresses',
	authMiddleware.authMiddleware,
	validators.addUserAddressValidations,
	addressController.addUserAddresses
);

router.delete('/user/me/addresses/:addressId', authMiddleware.authMiddleware, addressController.deleteUserAddress);

module.exports = router;