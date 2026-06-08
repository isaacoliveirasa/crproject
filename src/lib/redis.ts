/**
 * Upstash Redis REST client wrapper.
 * Interacts with Redis database via REST API, avoiding native TCP connection drivers.
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Local memory fallback cache for development sandbox
const localMemoryCache: Record<string, { value: string; expiry: number }> = {};

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    if (!redisUrl || !redisToken) {
      const cached = localMemoryCache[key];
      if (cached && cached.expiry > Date.now()) {
        return JSON.parse(cached.value) as T;
      }
      return null;
    }

    try {
      const res = await fetch(`${redisUrl}/get/${key}`, {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
      const data = await res.json();
      return data.result ? (JSON.parse(data.result) as T) : null;
    } catch (err) {
      console.warn(`Redis GET failed for key: ${key}`, err);
      return null;
    }
  },

  async set(key: string, value: any, expireSeconds?: number): Promise<void> {
    const stringified = JSON.stringify(value);

    if (!redisUrl || !redisToken) {
      localMemoryCache[key] = {
        value: stringified,
        expiry: Date.now() + (expireSeconds || 3600) * 1000,
      };
      return;
    }

    try {
      let endpoint = `${redisUrl}/set/${key}`;
      const params = new URLSearchParams();
      if (expireSeconds) {
        params.append('ex', String(expireSeconds));
      }
      
      const query = params.toString();
      if (query) {
        endpoint += `?${query}`;
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
        body: stringified,
      });
    } catch (err) {
      console.warn(`Redis SET failed for key: ${key}`, err);
    }
  },
};
