import type { PageServerLoad } from './$types';
import { readCodexConfig } from '$lib/server/codex/readers/config.js';

export const load: PageServerLoad = async () => {
	const config = readCodexConfig();
	return { config };
};
