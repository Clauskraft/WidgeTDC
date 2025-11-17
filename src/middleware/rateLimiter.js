const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

const createRateLimiter = (options = {}) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    }),
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  });
};

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
});

module.exports = { authLimiter, apiLimiter, createRateLimiter };
