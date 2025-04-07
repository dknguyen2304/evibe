// src/lib/redis/caching.ts
import redisClient from './config';
import { NextRequest, NextResponse } from 'next/server';

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400, // 1 day
};

// Cache key prefixes
export const CACHE_PREFIX = {
  API: 'api:',
  MOVIE: 'movie:',
  MOVIE_LIST: 'movieList:',
  CATEGORY: 'category:',
  USER: 'user:',
  SESSION: 'session:',
  STATS: 'stats:',
};

/**
 * Generate a cache key from a request
 */
export function generateCacheKey(req: NextRequest, prefix: string = CACHE_PREFIX.API): string {
  const url = new URL(req.url);
  return `${prefix}${url.pathname}${url.search}`;
}

/**
 * Cache API response with optimized settings
 */
export async function cacheApiResponse(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  ttl: number = CACHE_TTL.MEDIUM,
  keyPrefix: string = CACHE_PREFIX.API,
): Promise<NextResponse> {
  // Skip caching for non-GET requests
  if (req.method !== 'GET') {
    return handler();
  }

  // Generate cache key
  const cacheKey = generateCacheKey(req, keyPrefix);

  try {
    // Try to get from cache
    const cachedResponse = await redisClient.get(cacheKey);

    if (cachedResponse) {
      const data = JSON.parse(cachedResponse);
      // Return cached response with appropriate headers
      const response = NextResponse.json(data.body, { status: data.status });
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // If not in cache, execute handler
    const response = await handler();

    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
      try {
        const responseData = await response.clone().json();

        // Cache the response with appropriate TTL
        await redisClient.set(
          cacheKey,
          JSON.stringify({
            body: responseData,
            status: response.status,
          }),
          'EX',
          ttl,
        );

        // Add cache header
        response.headers.set('X-Cache', 'MISS');
      } catch (error) {
        console.error('Error caching response:', error);
      }
    }

    return response;
  } catch (error) {
    console.error('Cache error:', error);
    // If there's a cache error, just execute the handler
    return handler();
  }
}

/**
 * Invalidate cache by pattern with optimized approach
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    // Use SCAN instead of KEYS for production environments to avoid blocking
    let cursor = '0';
    let keys: string[] = [];

    do {
      // Use SCAN to get keys in batches
      const [nextCursor, scanKeys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);

      cursor = nextCursor;
      keys = keys.concat(scanKeys);

      // Delete keys in batches if we have some
      if (scanKeys.length > 0) {
        await redisClient.del(...scanKeys);
      }
    } while (cursor !== '0');

    return keys.length;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return 0;
  }
}

/**
 * Cache data with optimized settings
 */
export async function cacheData<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.MEDIUM,
): Promise<void> {
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error(`Error caching data for key ${key}:`, error);
  }
}

/**
 * Get cached data with type safety
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cachedData = await redisClient.get(key);
    return cachedData ? (JSON.parse(cachedData) as T) : null;
  } catch (error) {
    console.error(`Error getting cached data for key ${key}:`, error);
    return null;
  }
}

/**
 * Cache data with hash for structured objects
 */
export async function cacheHashData(
  key: string,
  data: Record<string, any>,
  ttl: number = CACHE_TTL.MEDIUM,
): Promise<void> {
  try {
    // Convert all values to strings
    const hashData: Record<string, string> = {};
    for (const [field, value] of Object.entries(data)) {
      hashData[field] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    // Use pipeline for better performance
    const pipeline = redisClient.pipeline();
    pipeline.hmset(key, hashData);
    pipeline.expire(key, ttl);
    await pipeline.exec();
  } catch (error) {
    console.error(`Error caching hash data for key ${key}:`, error);
  }
}

/**
 * Get cached hash data
 */
export async function getCachedHashData(
  key: string,
  fields?: string[],
): Promise<Record<string, any> | null> {
  try {
    let result: Record<string, string>;

    if (fields && fields.length > 0) {
      result = (await redisClient.hmget(key, ...fields)) as unknown as Record<string, string>;
    } else {
      result = await redisClient.hgetall(key);
    }

    if (!result || Object.keys(result).length === 0) {
      return null;
    }

    // Parse JSON values
    const parsedResult: Record<string, any> = {};
    for (const [field, value] of Object.entries(result)) {
      if (!value) continue;

      try {
        parsedResult[field] = JSON.parse(value);
      } catch {
        parsedResult[field] = value;
      }
    }

    return parsedResult;
  } catch (error) {
    console.error(`Error getting cached hash data for key ${key}:`, error);
    return null;
  }
}
