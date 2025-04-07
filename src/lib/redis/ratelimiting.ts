// src/lib/redis/ratelimiting.ts
import redisClient from './config';

// Rate limiting key prefixes
export const RATE_LIMIT_PREFIX = {
  API: 'ratelimit:api:',
  LOGIN: 'ratelimit:login:',
  REGISTRATION: 'ratelimit:registration:',
  COMMENT: 'ratelimit:comment:',
};

/**
 * Check and apply rate limiting
 * @param identifier Unique identifier (e.g., IP address, user ID)
 * @param action Action being rate limited (e.g., 'api', 'login')
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowSeconds Time window in seconds
 * @returns Object containing success status and remaining requests
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number = 100,
  windowSeconds: number = 60,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const key = `${action}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    // Remove old entries outside the current window
    await redisClient.zremrangebyscore(key, 0, windowStart);

    // Count requests in the current window
    const requestCount = await redisClient.zcard(key);

    // Check if rate limit is exceeded
    if (requestCount >= maxRequests) {
      // Get the oldest timestamp to calculate reset time
      const oldestTimestamp = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt =
        oldestTimestamp.length > 1
          ? parseInt(oldestTimestamp[1]) + windowSeconds
          : now + windowSeconds;

      return {
        success: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request to the sorted set
    await redisClient.zadd(key, now, `${now}-${Math.random().toString(36).substring(2, 15)}`);

    // Set expiration on the key
    await redisClient.expire(key, windowSeconds * 2);

    return {
      success: true,
      remaining: maxRequests - requestCount - 1,
      resetAt: now + windowSeconds,
    };
  } catch (error) {
    console.error(`Rate limiting error for ${key}:`, error);
    // In case of error, allow the request to proceed
    return {
      success: true,
      remaining: 0,
      resetAt: now + windowSeconds,
    };
  }
}

/**
 * Apply API rate limiting middleware
 * @param req Request object
 * @param res Response object
 * @param maxRequests Maximum requests per minute
 */
export async function apiRateLimiter(
  req: Request,
  maxRequests: number = 60,
): Promise<{ success: boolean; headers: Record<string, string> }> {
  // Get client IP from headers or connection
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Check rate limit
  const result = await checkRateLimit(
    ip,
    RATE_LIMIT_PREFIX.API,
    maxRequests,
    60, // 1 minute window
  );

  // Prepare headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };

  if (!result.success) {
    headers['Retry-After'] = Math.ceil(result.resetAt - Math.floor(Date.now() / 1000)).toString();
  }

  return {
    success: result.success,
    headers,
  };
}

/**
 * Apply login attempt rate limiting
 * @param ip IP address
 * @param email Email address
 * @param maxAttempts Maximum login attempts
 * @param windowSeconds Time window in seconds
 */
export async function loginRateLimiter(
  ip: string,
  email: string,
  maxAttempts: number = 5,
  windowSeconds: number = 300, // 5 minutes
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  // Rate limit by IP and email separately
  const ipResult = await checkRateLimit(
    ip,
    RATE_LIMIT_PREFIX.LOGIN,
    maxAttempts * 2, // Allow more attempts by IP
    windowSeconds,
  );

  const emailResult = await checkRateLimit(
    email,
    RATE_LIMIT_PREFIX.LOGIN,
    maxAttempts,
    windowSeconds,
  );

  // Use the most restrictive result
  if (!ipResult.success || !emailResult.success) {
    return {
      success: false,
      remaining: Math.min(ipResult.remaining, emailResult.remaining),
      resetAt: Math.max(ipResult.resetAt, emailResult.resetAt),
    };
  }

  return {
    success: true,
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
    resetAt: Math.max(ipResult.resetAt, emailResult.resetAt),
  };
}

/**
 * Reset rate limit for a specific identifier and action
 * @param identifier Unique identifier
 * @param action Action being rate limited
 */
export async function resetRateLimit(identifier: string, action: string): Promise<void> {
  const key = `${action}:${identifier}`;

  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Error resetting rate limit for ${key}:`, error);
  }
}
