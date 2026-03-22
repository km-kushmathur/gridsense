const cache = new Map();

function normalizeCity(city) {
  return (city || '').toLowerCase().trim();
}

function cacheKey(city, key) {
  return `${normalizeCity(city)}::${key}`;
}

export function get(city, key) {
  const entry = cache.get(cacheKey(city, key));
  if (!entry) return undefined;
  return entry;
}

export function set(city, key, data) {
  cache.set(cacheKey(city, key), { data, ts: Date.now() });
}

export function isStale(city, key, ttlMs) {
  const entry = cache.get(cacheKey(city, key));
  if (!entry) return true;
  return Date.now() - entry.ts > ttlMs;
}

export function getData(city, key) {
  const entry = get(city, key);
  return entry?.data ?? undefined;
}

export function getTimestamp(city, key) {
  const entry = get(city, key);
  return entry?.ts ?? null;
}

export function clear(city) {
  const prefix = normalizeCity(city) + '::';
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) {
      cache.delete(k);
    }
  }
}

export function clearAll() {
  cache.clear();
}

export function getAge(city, key) {
  const entry = get(city, key);
  if (!entry) return null;
  return Date.now() - entry.ts;
}

export function hasVisited(city) {
  const prefix = normalizeCity(city) + '::';
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) return true;
  }
  return false;
}

export function getLastVisitAge(city) {
  const prefix = normalizeCity(city) + '::';
  let latest = 0;
  for (const [k, v] of cache.entries()) {
    if (k.startsWith(prefix) && v.ts > latest) {
      latest = v.ts;
    }
  }
  return latest ? Date.now() - latest : null;
}
