// src/lib/redis/config.ts
import Redis from 'ioredis';

// Redis connection options
export const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    // Exponential backoff with max 10 seconds
    const delay = Math.min(times * 50, 10000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  // Add connection pool settings
  connectionName: 'rophim-app',
  // Add TLS options if needed for production
  ...(process.env.NODE_ENV === 'production' && process.env.REDIS_TLS === 'true'
    ? {
        tls: {
          rejectUnauthorized: false,
        },
      }
    : {}),
};

// Create Redis client with optimized configuration
const redisClient = new Redis(redisOptions);

// Add event listeners for better monitoring and error handling
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('close', () => {
  console.log('Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('Redis client reconnecting');
});

// Export the client
export default redisClient;

// Create a separate pub/sub client to avoid blocking the main client
export const redisPubSub = new Redis(redisOptions);

// Create a function to get a new client for specific operations
export function getRedisClient() {
  return new Redis(redisOptions);
}
