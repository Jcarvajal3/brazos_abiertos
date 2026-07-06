/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 *
 * NOTE: This is suitable for single-instance deployments.
 * For multi-instance (e.g., multiple Vercel serverless instances),
 * use an external store like Vercel KV or Upstash Redis.
 */

interface RateLimitEntry {
	count: number;
	windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store.entries()) {
		if (now - entry.windowStart > 60_000) {
			store.delete(key);
		}
	}
}, 5 * 60_000);

interface RateLimitOptions {
	/** Maximum requests per window */
	limit: number;
	/** Window duration in milliseconds */
	windowMs: number;
}

/**
 * Check if a key (e.g. IP address) exceeds the rate limit.
 * @returns `{ allowed: boolean; remaining: number; resetMs: number }`
 */
export function checkRateLimit(
	key: string,
	{ limit, windowMs }: RateLimitOptions
): { allowed: boolean; remaining: number; resetMs: number } {
	const now = Date.now();
	const entry = store.get(key);

	if (!entry || now - entry.windowStart > windowMs) {
		// New window
		store.set(key, { count: 1, windowStart: now });
		return { allowed: true, remaining: limit - 1, resetMs: now + windowMs };
	}

	if (entry.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			resetMs: entry.windowStart + windowMs
		};
	}

	entry.count++;
	return {
		allowed: true,
		remaining: limit - entry.count,
		resetMs: entry.windowStart + windowMs
	};
}

/**
 * Get client IP from request headers (Vercel / standard proxies).
 */
export function getClientIp(request: Request): string {
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		request.headers.get('x-real-ip') ??
		'unknown'
	);
}
