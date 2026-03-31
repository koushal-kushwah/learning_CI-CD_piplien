import logger from "../config/logger.js";
import { redis } from "../config/redis.config.js";

export const checkRedisHealth = async () => {
    try {
        await redis.ping();
        console.log("Redis is connected and healthy.");
        return true;
    } catch (error) {
        logger.error("Redis connection failed :", error);
        console.error("Redis connection failed :", error);
        return false;
    }
};

export const initializeRedis = async () => {
    const isHealthy = await checkRedisHealth();
    if (!isHealthy) {
        console.warn("Redis is not available, running without cache");
    }
};