import type { PageServerLoad } from './$types';
import { computeClaudeStats } from '$lib/server/readers/computed-stats.js';

export const load: PageServerLoad = async () => {
	// Everything is derived live from ~/.claude/projects/**/*.jsonl. The dashboard
	// previously read CLI-written caches (stats-cache.json + usage-data/session-meta),
	// which are no longer produced and left the charts blank.
	return await computeClaudeStats();
};
