// src/lib/redis/leaderboards.ts
import redisClient from './config';
import { CACHE_TTL } from './caching';

// Leaderboard key prefixes
export const LEADERBOARD_PREFIX = {
  POPULAR_MOVIES: 'leaderboard:popular:movies',
  TRENDING_MOVIES: 'leaderboard:trending:movies',
  TOP_RATED_MOVIES: 'leaderboard:toprated:movies',
  MOST_VIEWED_MOVIES: 'leaderboard:mostviewed:movies',
  MOST_COMMENTED_MOVIES: 'leaderboard:mostcommented:movies',
};

/**
 * Update movie popularity score in leaderboard
 * @param movieId Movie ID
 * @param score Popularity score
 * @param leaderboardKey Leaderboard key
 */
export async function updateLeaderboardScore(
  movieId: string,
  score: number,
  leaderboardKey: string = LEADERBOARD_PREFIX.POPULAR_MOVIES,
): Promise<void> {
  try {
    await redisClient.zadd(leaderboardKey, score, movieId);
  } catch (error) {
    console.error(`Error updating leaderboard score for movie ${movieId}:`, error);
  }
}

/**
 * Get top movies from leaderboard
 * @param limit Number of movies to return
 * @param leaderboardKey Leaderboard key
 */
export async function getTopMoviesFromLeaderboard(
  limit: number = 10,
  leaderboardKey: string = LEADERBOARD_PREFIX.POPULAR_MOVIES,
): Promise<string[]> {
  try {
    return await redisClient.zrevrange(leaderboardKey, 0, limit - 1);
  } catch (error) {
    console.error(`Error getting top movies from leaderboard ${leaderboardKey}:`, error);
    return [];
  }
}

/**
 * Get movie rank in leaderboard
 * @param movieId Movie ID
 * @param leaderboardKey Leaderboard key
 */
export async function getMovieRankInLeaderboard(
  movieId: string,
  leaderboardKey: string = LEADERBOARD_PREFIX.POPULAR_MOVIES,
): Promise<number | null> {
  try {
    const rank = await redisClient.zrevrank(leaderboardKey, movieId);
    return rank !== null ? rank + 1 : null; // Add 1 to convert from 0-based to 1-based ranking
  } catch (error) {
    console.error(
      `Error getting movie rank for ${movieId} in leaderboard ${leaderboardKey}:`,
      error,
    );
    return null;
  }
}

/**
 * Calculate and update movie popularity score based on various factors
 * @param movieId Movie ID
 * @param views Number of views
 * @param avgRating Average rating (0-10)
 * @param commentCount Number of comments
 * @param daysSinceRelease Days since movie release
 */
export async function calculateAndUpdatePopularityScore(
  movieId: string,
  views: number,
  avgRating: number,
  commentCount: number,
  daysSinceRelease: number,
): Promise<number> {
  // Popularity algorithm:
  // - Views have a significant impact
  // - Ratings are important (scale 0-10)
  // - Comments show engagement
  // - Newer content gets a boost

  // Normalize factors
  const viewFactor = Math.log10(views + 1) * 10; // Logarithmic scale for views
  const ratingFactor = avgRating * 10; // Scale rating (0-10) to (0-100)
  const commentFactor = Math.log10(commentCount + 1) * 5; // Logarithmic scale for comments
  const recencyFactor = Math.max(0, 100 - daysSinceRelease * 0.5); // Newer content gets higher score

  // Calculate final score (max theoretical score around 300)
  const score = viewFactor + ratingFactor + commentFactor + recencyFactor;

  // Update popular movies leaderboard
  await updateLeaderboardScore(movieId, score, LEADERBOARD_PREFIX.POPULAR_MOVIES);

  // Update trending movies leaderboard (more weight on recency)
  const trendingScore = viewFactor + ratingFactor + commentFactor + recencyFactor * 2;
  await updateLeaderboardScore(movieId, trendingScore, LEADERBOARD_PREFIX.TRENDING_MOVIES);

  // Update top rated leaderboard (only based on rating)
  await updateLeaderboardScore(movieId, avgRating * 10, LEADERBOARD_PREFIX.TOP_RATED_MOVIES);

  // Update most viewed leaderboard
  await updateLeaderboardScore(movieId, views, LEADERBOARD_PREFIX.MOST_VIEWED_MOVIES);

  // Update most commented leaderboard
  await updateLeaderboardScore(movieId, commentCount, LEADERBOARD_PREFIX.MOST_COMMENTED_MOVIES);

  return score;
}

/**
 * Initialize leaderboards with expiration
 */
export async function initializeLeaderboards(): Promise<void> {
  try {
    const pipeline = redisClient.pipeline();

    // Set expiration for all leaderboards
    Object.values(LEADERBOARD_PREFIX).forEach((key) => {
      pipeline.expire(key, CACHE_TTL.DAY);
    });

    await pipeline.exec();
  } catch (error) {
    console.error('Error initializing leaderboards:', error);
  }
}
