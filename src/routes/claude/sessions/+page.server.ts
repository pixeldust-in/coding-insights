import type { PageServerLoad } from './$types';
import { listAllSessions } from '$lib/server/readers/projects.js';
import { getSessionFacets } from '$lib/server/readers/session-facets.js';

export const load: PageServerLoad = async () => {
	const sessions = listAllSessions();

	// Enrich with facets data
	const enriched = sessions.map((s) => {
		const facets = getSessionFacets(s.sessionId);
		return {
			...s,
			outcome: facets?.outcome
		};
	});

	return { sessions: enriched };
};
