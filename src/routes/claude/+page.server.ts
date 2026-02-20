import type { PageServerLoad } from './$types';
import { readStatsCache } from '$lib/server/readers/stats.js';
import { readAllSessionMeta } from '$lib/server/readers/session-meta.js';

export const load: PageServerLoad = async () => {
	const stats = readStatsCache();
	const metaMap = readAllSessionMeta();

	// Aggregate tool counts and languages across all sessions
	const toolCounts: Record<string, number> = {};
	const languages: Record<string, number> = {};

	for (const meta of metaMap.values()) {
		for (const [tool, count] of Object.entries(meta.tool_counts)) {
			toolCounts[tool] = (toolCounts[tool] || 0) + count;
		}
		for (const [lang, count] of Object.entries(meta.languages)) {
			languages[lang] = (languages[lang] || 0) + count;
		}
	}

	// Compute total tokens
	let totalTokens = 0;
	for (const usage of Object.values(stats.modelUsage)) {
		totalTokens += usage.inputTokens + usage.outputTokens;
	}

	// Count active days
	const activeDays = stats.dailyActivity.length;

	return {
		stats,
		toolCounts,
		languages,
		totalTokens,
		activeDays
	};
};
