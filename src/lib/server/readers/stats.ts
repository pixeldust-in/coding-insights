import { readFileSync } from 'fs';
import { STATS_CACHE_PATH } from '../config.js';
import { getCached } from '../cache.js';
import type { StatsCache } from '../types.js';

export function readStatsCache(): StatsCache {
	return getCached(STATS_CACHE_PATH, () => {
		return JSON.parse(readFileSync(STATS_CACHE_PATH, 'utf-8'));
	});
}
