const jwt = require('jsonwebtoken');
let redis;
try {
    // Lazily require redis; in tests we may not have a live Redis
    redis = require('../db/redis');
} catch (_) {
    redis = null;
}

async function authMiddleware(req, res, next) {
    const token = req.cookies && req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // optional: deny if token is blacklisted
        if (redis) {
            try {
                const isBlacklisted = await redis.get(`blacklist:${token}`);
                if (isBlacklisted) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
            } catch (_) {
                // ignore redis errors for auth path to avoid hard failures
            }
        }
        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
}

module.exports = {
    authMiddleware,
};