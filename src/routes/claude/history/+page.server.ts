import type { PageServerLoad } from './$types';
import { readHistory } from '$lib/server/readers/history.js';
import { listAllSessions } from '$lib/server/readers/projects.js';

export const load: PageServerLoad = async () => {
	const history = readHistory();

	// Map sessionId → user-assigned session name so each prompt can show its session
	const nameById = new Map<string, string>();
	for (const s of listAllSessions()) {
		if (s.sessionName) nameById.set(s.sessionId, s.sessionName);
	}

	const enriched = history.map((e) => ({
		...e,
		sessionName: nameById.get(e.sessionId) ?? ''
	}));

	return { history: enriched };
};
