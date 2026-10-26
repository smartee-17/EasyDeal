import { redis } from '../../config/redis.js';

export const CacheService = {
  async get(key) {
    const data = await redis.get(key);
    if (!data) return null;
    return data; // already parsed by Upstash SDK — no JSON.parse needed
  },
  async set(key, value, ttl = 3600) {
    return await redis.set(
      key,
      value, // pass the object directly — Upstash serializes it for you
      {
        ex: ttl,
      },
    );
  },
  async del(key) {
    return await redis.del(key);
  },
  async clearPattern(pattern) {
    throw new Error('Use key tagging strategy instead of patterns');
  },
};
