const { body, validationResult } = require('express-validator');

const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

const registerUserValidations = [
    body('username')
        .isString()
        .withMessage("Username must be a string")
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 Characters long"),
    body('email')
        .isEmail()
        .withMessage("Invalid email address"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password Must be at least 6 characters long"),
    // fullName can be provided either nested or as top-level fields; make them optional validations
    body("fullName.firstName").optional()
        .isString().withMessage("First name must be a string")
        .notEmpty().withMessage("First name is required when provided"),
    body("fullName.lastName").optional()
        .isString().withMessage("Last name must be a String")
        .notEmpty().withMessage("Last Name is required when provided"),
    body("firstName").optional()
        .isString().withMessage("First name must be a string")
        .notEmpty().withMessage("First name is required when provided"),
    body("lastName").optional()
        .isString().withMessage("Last name must be a String")
        .notEmpty().withMessage("Last Name is required when provided"),
    body("role")
        .optional()
        .isIn(['user', 'seller'])
        .withMessage("Role must be either 'user' or 'seller'"),
    respondWithValidationErrors
]

const loginUserValidations = [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email address'),
    body('username')
        .optional()
        .isString()
        .withMessage('Username must be a String'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (req, res, next) => {
        if (!req.body.email && !req.body.username) {
            return res.status(400).json({ msg: "Either email or username is required" })
        }
        respondWithValidationErrors(req, res, next);
    }
]

const addUserAddressValidations = [
    body('street').isString().notEmpty().withMessage('street is required'),
    body('city').isString().notEmpty().withMessage('city is required'),
    body('state').isString().notEmpty().withMessage('state is required'),
    body('country').isString().notEmpty().withMessage('country is required'),
    body('pincode')
        .isString().withMessage('pincode must be a string')
        .matches(/^\d{6}$/).withMessage('pincode must be 6 digits'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
    respondWithValidationErrors
]

module.exports = {
    registerUserValidations,
    loginUserValidations,
    addUserAddressValidations
}