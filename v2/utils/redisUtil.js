const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

// Connect immediately (node-redis v4 is promise based)
(async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
})();

/**
 * Get a value from Redis.
 * @param {string} key
 * @returns {Promise<string|null>}
 */
const getAsync = async (key) => {
    try {
        return await redisClient.get(key);
    } catch (e) {
        console.error('Redis GET error:', e);
        return null;
    }
};

/**
 * Set a value in Redis and optionally set an expiry.
 * @param {string} key
 * @param {string} value
 * @param {number} [ttlSeconds] - Time to live in seconds
 */
const setAsync = async (key, value, ttlSeconds) => {
    try {
        if (ttlSeconds) {
            await redisClient.setEx(key, ttlSeconds, value);
        } else {
            await redisClient.set(key, value);
        }
    } catch (e) {
        console.error('Redis SET error:', e);
    }
};

module.exports = {
    redisClient,
    getAsync,
    setAsync
};
