import type { PageServerLoad } from './$types';
import { listProjectSessions, getProjectDisplayName } from '$lib/server/readers/projects.js';
import { getSessionFacets } from '$lib/server/readers/session-facets.js';

export const load: PageServerLoad = async ({ params }) => {
	const projectDir = params.project;
	const displayName = getProjectDisplayName(projectDir);
	const sessions = listProjectSessions(projectDir);

	// Enrich with facets data
	const enriched = sessions.map((s) => {
		const facets = getSessionFacets(s.sessionId);
		return {
			...s,
			outcome: facets?.outcome
		};
	});

	return {
		projectDir,
		displayName,
		sessions: enriched
	};
};
