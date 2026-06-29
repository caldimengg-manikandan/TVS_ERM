import Redis from 'ioredis';
import { env } from './env';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 5) {
          console.error('Redis max retries exceeded');
          return null;
        }
        return Math.min(times * 500, 5000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => console.log('✅ Redis connected'));
    redisClient.on('error', (err) => console.error('❌ Redis error:', err));
    redisClient.on('close', () => console.log('🔌 Redis connection closed'));
  }
  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  await client.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

// ============================================
// Redis Cache Helper
// ============================================
export class RedisCache {
  private client: Redis;
  private defaultTTL: number;

  constructor(defaultTTL = 300) {
    this.client = getRedisClient();
    this.defaultTTL = defaultTTL;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl ?? this.defaultTTL, serialized);
    } catch (err) {
      console.error('Redis set error:', err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error('Redis del error:', err);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      console.error('Redis delPattern error:', err);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  async setRefreshToken(userId: string, token: string, ttlSeconds: number): Promise<void> {
    await this.set(`refresh:${userId}:${token}`, { userId, token }, ttlSeconds);
  }

  async getRefreshToken(userId: string, token: string): Promise<boolean> {
    const data = await this.get(`refresh:${userId}:${token}`);
    return data !== null;
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    await this.del(`refresh:${userId}:${token}`);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.delPattern(`refresh:${userId}:*`);
  }
}

export const redisCache = new RedisCache();
