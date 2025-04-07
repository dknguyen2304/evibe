// src/lib/redis/stats.ts
import redisClient from './index';

export async function incrementViewCount(movieId: string) {
  await redisClient.hincrby('movie:views', movieId, 1);
}

export async function getViewCount(movieId: string) {
  const count = await redisClient.hget('movie:views', movieId);
  return count ? parseInt(count) : 0;
}

export async function addRating(movieId: string, rating: number) {
  // Add rating to sorted set
  await redisClient.zadd(`movie:ratings:${movieId}`, rating, Date.now().toString());

  // Update average rating
  const ratings = await redisClient.zrange(`movie:ratings:${movieId}`, 0, -1, 'WITHSCORES');
  const total = ratings.reduce((sum, _, i) => {
    if (i % 2 === 1) {
      // Scores are at odd indices
      return sum + parseInt(ratings[i]);
    }
    return sum;
  }, 0);

  const average = total / (ratings.length / 2);
  await redisClient.hset('movie:avgRating', movieId, average.toFixed(1));
}

export async function getAverageRating(movieId: string) {
  const rating = await redisClient.hget('movie:avgRating', movieId);
  return rating ? parseFloat(rating) : 0;
}
