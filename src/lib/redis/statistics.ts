// src/lib/redis/statistics.ts
import redisClient from './config';
import { CACHE_TTL } from './caching';

// Statistics key prefixes
export const STATS_PREFIX = {
  MOVIE_VIEWS: 'stats:movie:views',
  MOVIE_RATINGS: 'stats:movie:ratings',
  MOVIE_AVG_RATING: 'stats:movie:avgrating',
  DAILY_VIEWS: 'stats:daily:views',
  HOURLY_VIEWS: 'stats:hourly:views',
  USER_ACTIVITY: 'stats:user:activity',
  CATEGORY_POPULARITY: 'stats:category:popularity',
};

/**
 * Increment movie view count
 * @param movieId Movie ID
 * @param increment Amount to increment (default: 1)
 */
export async function incrementMovieViewCount(
  movieId: string,
  increment: number = 1,
): Promise<number> {
  try {
    // Increment the movie view count
    const newCount = await redisClient.hincrby(STATS_PREFIX.MOVIE_VIEWS, movieId, increment);

    // Also track daily and hourly statistics
    const date = new Date();
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const hourKey = `${dateKey}:${date.getHours()}`; // YYYY-MM-DD:HH

    // Use pipeline for better performance
    const pipeline = redisClient.pipeline();
    pipeline.hincrby(`${STATS_PREFIX.DAILY_VIEWS}:${dateKey}`, movieId, increment);
    pipeline.hincrby(`${STATS_PREFIX.HOURLY_VIEWS}:${hourKey}`, movieId, increment);

    // Set expiration for daily and hourly stats
    pipeline.expire(`${STATS_PREFIX.DAILY_VIEWS}:${dateKey}`, CACHE_TTL.DAY * 30); // Keep for 30 days
    pipeline.expire(`${STATS_PREFIX.HOURLY_VIEWS}:${hourKey}`, CACHE_TTL.DAY * 2); // Keep for 2 days

    await pipeline.exec();

    return newCount;
  } catch (error) {
    console.error(`Error incrementing view count for movie ${movieId}:`, error);
    return 0;
  }
}

/**
 * Get movie view count
 * @param movieId Movie ID
 */
export async function getMovieViewCount(movieId: string): Promise<number> {
  try {
    const count = await redisClient.hget(STATS_PREFIX.MOVIE_VIEWS, movieId);
    return count ? parseInt(count) : 0;
  } catch (error) {
    console.error(`Error getting view count for movie ${movieId}:`, error);
    return 0;
  }
}

/**
 * Add movie rating
 * @param movieId Movie ID
 * @param rating Rating value (0-10)
 * @param userId User ID (optional)
 */
export async function addMovieRating(
  movieId: string,
  rating: number,
  userId?: string,
): Promise<number> {
  try {
    const timestamp = Date.now();
    const ratingKey = userId ? `${userId}:${timestamp}` : `anon:${timestamp}`;

    // Add rating to sorted set with timestamp as score
    await redisClient.zadd(
      `${STATS_PREFIX.MOVIE_RATINGS}:${movieId}`,
      timestamp,
      `${ratingKey}:${rating}`,
    );

    // Calculate new average rating
    const ratings = await redisClient.zrange(`${STATS_PREFIX.MOVIE_RATINGS}:${movieId}`, 0, -1);

    let sum = 0;
    let count = 0;

    for (const entry of ratings) {
      const ratingValue = parseFloat(entry.split(':').pop() || '0');
      if (!isNaN(ratingValue)) {
        sum += ratingValue;
        count++;
      }
    }

    const average = count > 0 ? sum / count : 0;
    const roundedAverage = Math.round(average * 10) / 10; // Round to 1 decimal place

    // Store average rating
    await redisClient.hset(STATS_PREFIX.MOVIE_AVG_RATING, movieId, roundedAverage.toString());

    // Set expiration for ratings
    await redisClient.expire(`${STATS_PREFIX.MOVIE_RATINGS}:${movieId}`, CACHE_TTL.DAY * 90); // Keep for 90 days

    return roundedAverage;
  } catch (error) {
    console.error(`Error adding rating for movie ${movieId}:`, error);
    return 0;
  }
}

/**
 * Get movie average rating
 * @param movieId Movie ID
 */
export async function getMovieAverageRating(movieId: string): Promise<number> {
  try {
    const rating = await redisClient.hget(STATS_PREFIX.MOVIE_AVG_RATING, movieId);
    return rating ? parseFloat(rating) : 0;
  } catch (error) {
    console.error(`Error getting average rating for movie ${movieId}:`, error);
    return 0;
  }
}

/**
 * Track user activity
 * @param userId User ID
 * @param action Action performed (e.g., 'view', 'rate', 'comment')
 * @param entityId Entity ID (e.g., movie ID)
 */
export async function trackUserActivity(
  userId: string,
  action: string,
  entityId: string,
): Promise<void> {
  try {
    const timestamp = Date.now();
    const activityKey = `${STATS_PREFIX.USER_ACTIVITY}:${userId}`;

    // Add activity to sorted set with timestamp as score
    await redisClient.zadd(activityKey, timestamp, `${action}:${entityId}:${timestamp}`);

    // Trim to keep only the most recent 100 activities
    await redisClient.zremrangebyrank(activityKey, 0, -101);

    // Set expiration
    await redisClient.expire(activityKey, CACHE_TTL.DAY * 30); // Keep for 30 days
  } catch (error) {
    console.error(`Error tracking activity for user ${userId}:`, error);
  }
}

/**
 * Get user recent activity
 * @param userId User ID
 * @param limit Number of activities to return
 */
export async function getUserRecentActivity(
  userId: string,
  limit: number = 20,
): Promise<Array<{ action: string; entityId: string; timestamp: number }>> {
  try {
    const activityKey = `${STATS_PREFIX.USER_ACTIVITY}:${userId}`;
    const activities = await redisClient.zrevrange(activityKey, 0, limit - 1);

    return activities.map((activity) => {
      const [action, entityId, timestamp] = activity.split(':');
      return {
        action,
        entityId,
        timestamp: parseInt(timestamp),
      };
    });
  } catch (error) {
    console.error(`Error getting recent activity for user ${userId}:`, error);
    return [];
  }
}

/**
 * Increment category popularity
 * @param categoryId Category ID
 * @param increment Amount to increment (default: 1)
 */
export async function incrementCategoryPopularity(
  categoryId: string,
  increment: number = 1,
): Promise<string> {
  try {
    return await redisClient.zincrby(STATS_PREFIX.CATEGORY_POPULARITY, increment, categoryId);
  } catch (error) {
    console.error(`Error incrementing popularity for category ${categoryId}:`, error);
    return '0';
  }
}

/**
 * Get popular categories
 * @param limit Number of categories to return
 */
export async function getPopularCategories(limit: number = 10): Promise<string[]> {
  try {
    return await redisClient.zrevrange(STATS_PREFIX.CATEGORY_POPULARITY, 0, limit - 1);
  } catch (error) {
    console.error('Error getting popular categories:', error);
    return [];
  }
}
