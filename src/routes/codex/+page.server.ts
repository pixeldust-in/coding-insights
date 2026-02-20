import type { PageServerLoad } from './$types';
import { computeCodexStats } from '$lib/server/codex/readers/stats.js';

export const load: PageServerLoad = async () => {
	const stats = await computeCodexStats();
	return { stats };
};
