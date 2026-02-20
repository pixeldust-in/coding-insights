import type { PageServerLoad } from './$types';
import { listAllCodexSessions } from '$lib/server/codex/readers/sessions.js';

export const load: PageServerLoad = async () => {
	const sessions = await listAllCodexSessions();
	return { sessions };
};
