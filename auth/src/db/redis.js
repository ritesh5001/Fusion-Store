const { Redis } = require('ioredis');

function createRedisClient() {
    if (process.env.NODE_ENV === 'test') {
        // Minimal in-memory stub for tests
        const store = new Map();
        return {
            async get(key) { return store.get(key) || null; },
            async set(key, value, mode, ttl) {
                store.set(key, value);
                if (mode === 'EX' && typeof ttl === 'number') {
                    setTimeout(() => store.delete(key), ttl * 1000).unref?.();
                }
                return 'OK';
            },
            on() {},
        };
    }

    const client = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    });

    client.on('connect', () => {
        console.log('Connected to Redis');
    });

    client.on('error', (err) => {
        console.error('Redis connection error:', err.message || err);
    });

    client.on('ready', () => {
        console.log('Redis is ready to use');
    });

    return client;
}

module.exports = createRedisClient();