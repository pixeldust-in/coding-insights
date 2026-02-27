import { existsSync, readFileSync } from 'fs';
import { STATS_CACHE_PATH } from '../config.js';
import { getCached } from '../cache.js';
import type { StatsCache } from '../types.js';

const emptyStats: StatsCache = {
	version: 1,
	lastComputedDate: '',
	dailyActivity: [],
	dailyModelTokens: [],
	modelUsage: {},
	totalSessions: 0,
	totalMessages: 0,
	longestSession: { sessionId: '', duration: 0, messageCount: 0, timestamp: '' },
	firstSessionDate: '',
	hourCounts: {}
};

export function readStatsCache(): StatsCache {
	if (!existsSync(STATS_CACHE_PATH)) return emptyStats;
	return getCached(STATS_CACHE_PATH, () => {
		return JSON.parse(readFileSync(STATS_CACHE_PATH, 'utf-8'));
	});
}
