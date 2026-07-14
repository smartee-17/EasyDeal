import { CacheService } from "./cache.service.js";

export const cacheWrapper = async ({
    key, 
    ttl = 3600,
    fetchFunction,
}) => {
    const cached = await CacheService.get(key);

    if (cached) {
        console.log(`Cache gotten ${key}`);
        return cached
    }

    const result = await fetchFunction();

    if (!result) return null;

    await CacheService.set(key, result, ttl);

    return result;
};

export const cacheDelete = async (key) => {
    try {
        await CacheService.del(key);
    } catch (err) {
        console.log('Cache delete error:', err);
    }
};