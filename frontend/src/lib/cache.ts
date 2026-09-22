interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Fast client-side SWR cache for instant page navigation
 * @param key Cache key (e.g. 'products:shop:newest')
 * @param fetcher Async function that fetches fresh data
 * @param ttlMs Time to live in milliseconds (default: 30 seconds)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 30000,
): Promise<T> {
  const cached = memoryCache.get(key);
  const now = Date.now();

  // If cache is fresh, return immediately
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // Fetch fresh data
  try {
    const fresh = await fetcher();
    if (fresh !== undefined && fresh !== null) {
      memoryCache.set(key, { data: fresh, timestamp: now });
    }
    return fresh;
  } catch (err) {
    // If fresh fetch fails but we have stale cache, return stale cache
    if (cached) {
      return cached.data;
    }
    throw err;
  }
}

/**
 * Clear cached entries
 */
export function clearClientCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
}
