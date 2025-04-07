// src/lib/redis/apiCache.ts
import { NextRequest, NextResponse } from 'next/server';
import redisClient from './index';

const DEFAULT_CACHE_TTL = 60 * 5; // 5 minutes

export async function cacheApiResponse(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  ttl: number = DEFAULT_CACHE_TTL,
) {
  const cacheKey = `api:${req.nextUrl.pathname}${req.nextUrl.search}`;

  // Try to get from cache
  const cachedResponse = await redisClient.get(cacheKey);

  if (cachedResponse) {
    const data = JSON.parse(cachedResponse);
    return NextResponse.json(data.body, { status: data.status });
  }

  // If not in cache, execute handler
  const response = await handler();
  const responseData = await response.json();

  // Cache the response
  await redisClient.set(
    cacheKey,
    JSON.stringify({
      body: responseData,
      status: response.status,
    }),
    'EX',
    ttl,
  );

  return response;
}

export async function invalidateCache(pattern: string) {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
}
