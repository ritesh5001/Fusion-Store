const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 * Extracts validation errors from the request and returns them in a formatted response
 */
function handleValidationErrors(req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			message: 'Validation failed',
			errors: errors.array().map((err) => ({
				field: err.path || err.param,
				message: err.msg,
				value: err.value
			}))
		});
	}
	next();
}

module.exports = handleValidationErrors;


