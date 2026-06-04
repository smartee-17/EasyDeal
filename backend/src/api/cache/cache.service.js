import { redis } from "../../config/redis";

export const CacheService = {
    async get(key) {
        return await redis.get(key);
    },

    async set(key, value, ttl = 3600) {
        return await redis.set(key, value, {
            ex: ttl,
        });
    },

    async del(key) {
        return await redis.del(key);
    },

    async clearPattern(pattern){
        throw new Error("Use key tagging strategy instead of patterns");
    }
}