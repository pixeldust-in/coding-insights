import type { PageServerLoad } from './$types';
import { readCodexHistory } from '$lib/server/codex/readers/history.js';

export const load: PageServerLoad = async () => {
	const history = readCodexHistory();
	return { history };
};
