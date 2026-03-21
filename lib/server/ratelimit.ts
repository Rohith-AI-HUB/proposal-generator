// Route-level rate limiter.
//
// Production (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set):
//   Upstash Redis-backed sliding window: 5 requests per 15 minutes per IP.
//   Safe for distributed Vercel deployment -- state lives in Redis, not memory.
//
// Development (env vars absent):
//   In-memory fixed-window fallback. Not distributed; only correct for a single
//   process. Logs a one-time warning on first use so the absence of Redis is
//   never silent.
//
// Callers receive a uniform RateLimitResult regardless of which backend ran.

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   number; // Unix timestamp ms -- when the window resets
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_HITS  = 5;

// --- In-memory fallback (development only) -----------------------------------

type MemEntry = { hits: number; windowStart: number };
const _memStore = new Map<string, MemEntry>();

function checkMemory(id: string): RateLimitResult {
  const now   = Date.now();
  const entry = _memStore.get(id);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    _memStore.set(id, { hits: 1, windowStart: now });
    return { allowed: true, remaining: MAX_HITS - 1, resetAt: now + WINDOW_MS };
  }

  entry.hits += 1;
  return {
    allowed:   entry.hits <= MAX_HITS,
    remaining: Math.max(0, MAX_HITS - entry.hits),
    resetAt:   entry.windowStart + WINDOW_MS,
  };
}

// --- Upstash-backed sliding window (production) ------------------------------
//
// Lazy-initialised on first call. Using dynamic import so that missing the
// @upstash packages in dev does not cause a module-load error -- the import
// only runs when the env vars are present (i.e. in production).

type UpstashLimiter = {
  limit: (id: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

let _upstashLimiter: UpstashLimiter | null = null;

async function checkUpstash(id: string): Promise<RateLimitResult> {
  if (!_upstashLimiter) {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis }     = await import("@upstash/redis");
    _upstashLimiter = new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(MAX_HITS, "15 m"),
      analytics: false,
    }) as UpstashLimiter;
  }

  const result = await _upstashLimiter.limit(id);
  return {
    allowed:   result.success,
    remaining: result.remaining,
    resetAt:   result.reset,
  };
}

// --- Public API --------------------------------------------------------------

let _warnedDevMode = false;

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasUpstash) {
    return checkUpstash(identifier);
  }

  if (!_warnedDevMode) {
    console.warn(
      "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set -- " +
      "using in-memory fallback. Not suitable for production."
    );
    _warnedDevMode = true;
  }

  return checkMemory(identifier);
}
