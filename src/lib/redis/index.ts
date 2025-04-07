// src/lib/redis/index.ts
import redisClient, { redisPubSub, getRedisClient } from './config';
import {
  cacheApiResponse,
  invalidateCache,
  cacheData,
  getCachedData,
  cacheHashData,
  getCachedHashData,
  CACHE_TTL,
  CACHE_PREFIX,
} from './caching';
import {
  updateLeaderboardScore,
  getTopMoviesFromLeaderboard,
  getMovieRankInLeaderboard,
  calculateAndUpdatePopularityScore,
  initializeLeaderboards,
  LEADERBOARD_PREFIX,
} from './leaderboards';
import {
  incrementMovieViewCount,
  getMovieViewCount,
  addMovieRating,
  getMovieAverageRating,
  trackUserActivity,
  getUserRecentActivity,
  incrementCategoryPopularity,
  getPopularCategories,
  STATS_PREFIX,
} from './statistics';
import {
  checkRateLimit,
  apiRateLimiter,
  loginRateLimiter,
  resetRateLimit,
  RATE_LIMIT_PREFIX,
} from './ratelimiting';

// Export Redis client
export default redisClient;
export { redisPubSub, getRedisClient };

// Export caching functions
export {
  cacheApiResponse,
  invalidateCache,
  cacheData,
  getCachedData,
  cacheHashData,
  getCachedHashData,
  CACHE_TTL,
  CACHE_PREFIX,
};

// Export leaderboard functions
export {
  updateLeaderboardScore,
  getTopMoviesFromLeaderboard,
  getMovieRankInLeaderboard,
  calculateAndUpdatePopularityScore,
  initializeLeaderboards,
  LEADERBOARD_PREFIX,
};

// Export statistics functions
export {
  incrementMovieViewCount,
  getMovieViewCount,
  addMovieRating,
  getMovieAverageRating,
  trackUserActivity,
  getUserRecentActivity,
  incrementCategoryPopularity,
  getPopularCategories,
  STATS_PREFIX,
};

// Export rate limiting functions
export { checkRateLimit, apiRateLimiter, loginRateLimiter, resetRateLimit, RATE_LIMIT_PREFIX };
