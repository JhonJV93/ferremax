const cache = new Map<string, { value: unknown; expiresAt: number }>();

// Tiempos de vida
const TTL_STATIC = 5 * 60 * 1000;   // 5 minutos (datos que cambian poco)
const TTL_DYNAMIC = 60 * 1000;      // 1 minuto (datos que se actualizan seguido)

export const getCache = (key: string) => {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCache = (key: string, value: unknown, isStatic = false) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + (isStatic ? TTL_STATIC : TTL_DYNAMIC)
  });
};

export const invalidateCache = (pattern: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) cache.delete(key);
  }
};