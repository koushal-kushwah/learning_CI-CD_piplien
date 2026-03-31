import ApiError from './ApiError.js';

// Simple in-memory rate limiter (Redis ke bina)
const rateLimitStore = new Map();

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Cleanup every minute
setInterval(cleanupExpiredEntries, 60000);

export const checkRateLimit = (identifier, limit, windowInSeconds) => {
  const now = Date.now();
  const windowMs = windowInSeconds * 1000;
  const key = `rate_limit:${identifier}`;

  const record = rateLimitStore.get(key) || {
    count: 0,
    resetTime: now + windowMs,
  };

  // Reset if window has passed
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count += 1;
  const allowed = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  const reset = Math.ceil((record.resetTime - now) / 1000);

  rateLimitStore.set(key, record);

  return {
    allowed,
    remaining,
    reset,
  };
};

export const rateLimiter = (limit = 20, windowInSeconds = 60) => {
  return async (req, res, next) => {
    try {
      const identifier = typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for']
        : req.ip || 'unknown';

      const result = checkRateLimit(identifier, limit, windowInSeconds);

      if (!result.allowed) {
        throw new ApiError(429, `Rate limit exceeded. Try again in ${result.reset} seconds.`);
      }

      // Add rate limit info to response headers
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.reset.toString());

      next();
    } catch (error) {
      next(error);
    }
  };
};

// API key based rate limiter
export const apiKeyRateLimiter = (limit = 100, windowInSeconds = 3600) => {
  return async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        return next();
      }

      const result = checkRateLimit(`api_key:${apiKey}`, limit, windowInSeconds);

      if (!result.allowed) {
        throw new ApiError(429, `API rate limit exceeded for this key. Try again in ${result.reset} seconds.`);
      }

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.reset.toString());

      next();
    } catch (error) {
      next(error);
    }
  };
};

// import { checkRateLimit } from '../redis/redisUtils.js';
// import ApiError from './ApiError.js';

// export const rateLimiter = (limit = 10, windowInSeconds = 60) => {
//     return async (req, res, next) => {
//         try {
//             const identifier = typeof req.headers['x-forwarded-for'] === 'string'
//                 ? req.headers['x-forwarded-for']
//                 : req.ip || 'unknown';

//             const result = await checkRateLimit(identifier, limit, windowInSeconds);

//             if (!result.allowed) {
//                 throw new ApiError(429, `Rate limit exceeded. Try again in ${result.reset} seconds.`);
//             }

//             // Add rate limit info to response headers
//             res.setHeader('X-RateLimit-Limit', limit.toString());
//             res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
//             res.setHeader('X-RateLimit-Reset', result.reset.toString());

//             next();
//         } catch (error) {
//             next(error);
//         }
//     };
// };

// // API key based rate limiter
// export const apiKeyRateLimiter = (limit = 100, windowInSeconds = 3600) => {
//     return async (req, res, next) => {
//         try {
//             const apiKey = req.headers['x-api-key'];

//             if (!apiKey) {
//                 return next();
//             }

//             const result = await checkRateLimit(`api_key:${apiKey}`, limit, windowInSeconds);

//             if (!result.allowed) {
//                 throw new ApiError(429, `API rate limit exceeded for this key. Try again in ${result.reset} seconds.`);
//             }

//             res.setHeader('X-RateLimit-Limit', limit.toString());
//             res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
//             res.setHeader('X-RateLimit-Reset', result.reset.toString());

//             next();
//         } catch (error) {
//             next(error);
//         }
//     };
// };