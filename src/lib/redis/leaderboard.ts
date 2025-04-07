// src/lib/redis/leaderboard.ts
import redisClient from './index';

export async function updatePopularityScore(movieId: string, score: number) {
  await redisClient.zadd('leaderboard:popular', score, movieId);
}

export async function getPopularMovies(limit: number = 10) {
  return await redisClient.zrevrange('leaderboard:popular', 0, limit - 1);
}

// Calculate popularity score based on views, ratings, and recency
export async function calculatePopularityScore(
  movieId: string,
  views: number,
  avgRating: number,
  daysSinceRelease: number,
) {
  // Simple algorithm: views + (avgRating * 100) - (daysSinceRelease * 0.5)
  const score = views + avgRating * 100 - daysSinceRelease * 0.5;
  await updatePopularityScore(movieId, score);
  return score;
}
