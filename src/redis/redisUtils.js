import { redis } from '../config/redis.config.js';
import logger from '../config/logger.js';

export const redisSet = async (key, value, ttlInSeconds) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlInSeconds) {
      await redis.setex(key, ttlInSeconds, stringValue);
    } else {
      await redis.set(key, stringValue);
    }

    return true;
  } catch (error) {
    logger.error(`Redis set error for key ${key}`, error);
    console.error(`Redis set error for key ${key}`, error);
    return false;
  }
};

export const redisGet = async (key) => {
  try {
    const data = await redis.get(key);

    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      return error;
    }
  } catch (error) {
    logger.error(`Redis get error for key ${key}`, error);
    console.error(`Redis get error for key ${key}`, error);
    return null;
  }
};

export const redisDel = async (key) => {
  try {
    const result = await redis.del(key);
    return result > 0;
  } catch (error) {
    logger.error(`Redis delete error for key ${key}`, error);
    console.error(`Redis delete error for key ${key}`, error);
    return false;
  }
};

export const redisExists = async (key) => {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Redis exists error for key ${key}`, error);
    console.error(`Redis exists error for key ${key}`, error);
    return false;
  }
};

export const redisIncr = async (key) => {
  try {
    return await redis.incr(key);
  } catch (error) {
    logger.error(`Redis incr error for key ${key}`, error);
    console.error(`Redis incr error for key ${key}`, error);
    return null;
  }
};

export const redisDecr = async (key) => {
  try {
    return await redis.decr(key);
  } catch (error) {
    logger.error(`Redis decr error for key ${key}`, error);
    console.error(`Redis decr error for key ${key}`, error);
    return null;
  }
};

// Cache management functions
export const cacheWithRedis = async (key, fetchData, ttlInSeconds = 3600) => {
  try {
    const cacheData = await redisGet(key);

    if (cacheData !== null) {
      logger.info(`Cache HIT for key: ${key}`);
      console.info(`Cache HIT for key: ${key}`);
      return cacheData;
    }

    logger.info(`Cache MISS for key: ${key}. Fetching from source...`);
    console.info(`Cache MISS for key: ${key}. Fetching from source...`);

    const freshData = await fetchData();

    await redisSet(key, freshData, ttlInSeconds);

    return freshData;
  } catch (error) {
    logger.error(`Cache error for key ${key}:`, error);
    // Fallback to fetching fresh data
    return await fetchData();
  }
};

export const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    const deleted = await redis.del(...keys);

    logger.info(`Invalidated ${deleted} keys matching pattern: ${pattern}`);

    return deleted;
  } catch (error) {
    logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
    console.error(`Cache invalidation error for pattern ${pattern}:`, error);
    return 0;
  }
};

// User-specific Redis functions
export const cacheUserData = async (userId, userData, ttlInSeconds = 1800) => {
  const key = `user:${userId}`;
  return await redisSet(key, userData, ttlInSeconds);
};

export const getUserFromCache = async (userId) => {
  const key = `user:${userId}`;
  return await redisGet(key);
};

export const deleteUserCache = async (userId) => {
  const key = `user:${userId}`;
  return await redisDel(key);
};

// Rate limiting function
export const checkRateLimit = async (identifier, limit = 10, windowInSeconds = 30) => {
  const key = `rate_limit:${identifier}`;

  try {
    const current = await redisIncr(key);

    if (current === 1) {
      // First request in this window, set TTL
      await redis.expire(key, windowInSeconds);
    }

    const remaining = Math.max(0, limit - current);
    const ttl = await redis.ttl(key);

    return {
      allowed: current <= limit,
      remaining,
      reset: ttl,
    };
  } catch (error) {
    logger.error(`Rate limit check error for ${identifier}:`, error);
    // Allow request if Redis fails
    return {
      allowed: true,
      remaining: limit,
      reset: windowInSeconds,
    };
  }
};