import { CacheService } from "./cache.service";

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

    console.log(`Cache miss ${key}`);

    const result = await fetchFunction();

    if (!result) return null;

    await CacheService.set(key, result, ttl);

    return result;
};