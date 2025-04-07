// src/lib/redis/sessionCache.ts
import redisClient from './index';

const SESSION_CACHE_TTL = 60 * 60 * 24; // 24 hours

export async function cacheUserSession(userId: string, sessionData: any) {
  await redisClient.set(`session:${userId}`, JSON.stringify(sessionData), 'EX', SESSION_CACHE_TTL);
}

export async function getCachedUserSession(userId: string) {
  const cachedData = await redisClient.get(`session:${userId}`);
  return cachedData ? JSON.parse(cachedData) : null;
}

export async function invalidateUserSession(userId: string) {
  await redisClient.del(`session:${userId}`);
}
