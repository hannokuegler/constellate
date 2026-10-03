// Best-effort in-memory rate limit for /api/explain. Per server instance only (Vercel may run several),
// so it caps abuse of one warm instance, it is not a global quota. A real quota needs a shared store.

interface Bucket {
  start: number;
  count: number;
}

const MAX_KEYS = 5000;

export class FixedWindowLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Counts one hit for key; returns seconds until the window resets when the limit is exceeded, else 0. */
  hit(key: string, now = Date.now()): number {
    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.start >= this.windowMs) {
      if (this.buckets.size >= MAX_KEYS) this.prune(now);
      bucket = { start: now, count: 0 };
      this.buckets.set(key, bucket);
    }
    bucket.count++;
    return bucket.count > this.limit ? Math.max(1, Math.ceil((bucket.start + this.windowMs - now) / 1000)) : 0;
  }

  private prune(now: number) {
    for (const [key, bucket] of this.buckets) if (now - bucket.start >= this.windowMs) this.buckets.delete(key);
    // still full (many distinct clients inside one window): drop the oldest entries
    if (this.buckets.size >= MAX_KEYS) [...this.buckets.keys()].slice(0, MAX_KEYS / 2).forEach((k) => this.buckets.delete(k));
  }
}

/** Client address as set by the hosting proxy (Vercel overwrites x-forwarded-for / x-real-ip). */
export function clientKey(request: Request): string {
  const real = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (real || forwarded || "unknown").trim().slice(0, 64);
}
