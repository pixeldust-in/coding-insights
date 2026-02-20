import type { PageServerLoad } from './$types';
import { readHistory } from '$lib/server/readers/history.js';

export const load: PageServerLoad = async () => {
	const history = readHistory();
	return { history };
};
