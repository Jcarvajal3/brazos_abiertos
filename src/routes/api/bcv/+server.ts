import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

let cachedRate: number | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache duration

export const GET: RequestHandler = async () => {
	const now = Date.now();

	// Return cached rate if still valid
	if (cachedRate && (now - cacheTimestamp < CACHE_DURATION_MS)) {
		return json({ success: true, rate: cachedRate, source: 'cache' });
	}

	try {
		// Fetch official rate from dolarapi
		const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
			signal: AbortSignal.timeout(3000)
		});

		if (response.ok) {
			const bcvData = await response.json();
			if (bcvData && typeof bcvData.promedio === 'number') {
				cachedRate = bcvData.promedio;
				cacheTimestamp = now;
				return json({ success: true, rate: cachedRate, source: 'bcv_api' });
			}
		}
	} catch (e) {
		console.error('Error fetching BCV rate in SvelteKit API endpoint:', e);
	}

	// Fallback to previously cached rate or a reasonable default if external fetch failed
	const rateToReturn = cachedRate ?? 40.0;
	return json({
		success: true,
		rate: rateToReturn,
		source: cachedRate ? 'cache_fallback' : 'default_fallback'
	});
};
