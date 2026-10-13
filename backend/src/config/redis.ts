import Redis from 'ioredis';
import { env } from './env';

let redisClient: Redis | null = null;

/**
 * Get or create Redis client. Returns null if REDIS_URL is not configured.
 * This is optional — the app works without Redis.
 */
export const getRedisClient = (): Redis | null => {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('connect', () => console.log('✅ Redis connected'));
    redisClient.on('error', (err) => console.warn('⚠️ Redis error:', err.message));
  }

  return redisClient;
};

/**
 * Cache helper: get value from Redis, or compute and store it.
 */
export const cacheGet = async <T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Redis unavailable — fall through to fetcher
    }
  }

  const data = await fetcher();

  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch {
      // Silently fail — caching is optional
    }
  }

  return data;
};

/**
 * Invalidate a cache key.
 */
export const cacheInvalidate = async (pattern: string): Promise<void> => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
};
