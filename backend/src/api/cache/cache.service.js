import { redis } from "../../config/redis.js";

export const CacheService = {
    async get(key) {
        const data = await redis.get(key);

        if(!data) return null;

        return JSON.parse(data);
    },

    async set(key, value, ttl = 3600) {
        return await redis.set(
            key, 
            JSON.stringify(value), 
            {
            ex: ttl,
            }
    );
    },

    async del(key) {
        return await redis.del(key);
    },

    async clearPattern(pattern){
        throw new Error(
            "Use key tagging strategy instead of patterns"
        );
    }
}