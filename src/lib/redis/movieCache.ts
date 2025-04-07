// src/lib/redis/movieCache.ts
import redisClient from './index';

const MOVIE_CACHE_TTL = 60 * 60; // 1 hour
const MOVIE_LIST_CACHE_TTL = 60 * 10; // 10 minutes

export async function cacheMovieData(movieId: string, data: any) {
  await redisClient.set(`movie:${movieId}`, JSON.stringify(data), 'EX', MOVIE_CACHE_TTL);
}

export async function getCachedMovie(movieId: string) {
  const cachedData = await redisClient.get(`movie:${movieId}`);
  return cachedData ? JSON.parse(cachedData) : null;
}

export async function cacheMovieList(key: string, data: any[]) {
  await redisClient.set(`movieList:${key}`, JSON.stringify(data), 'EX', MOVIE_LIST_CACHE_TTL);
}

export async function getCachedMovieList(key: string) {
  const cachedData = await redisClient.get(`movieList:${key}`);
  return cachedData ? JSON.parse(cachedData) : null;
}

export async function invalidateMovieCache(movieId: string) {
  await redisClient.del(`movie:${movieId}`);
  // Also invalidate any lists that might contain this movie
  const keys = await redisClient.keys('movieList:*');
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
}
