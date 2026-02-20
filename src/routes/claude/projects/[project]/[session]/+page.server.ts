import type { PageServerLoad } from './$types';
import { loadSession } from '$lib/server/readers/sessions.js';
import { getProjectDisplayName } from '$lib/server/readers/projects.js';

export const load: PageServerLoad = async ({ params }) => {
	const { project: projectDir, session: sessionId } = params;
	const displayName = getProjectDisplayName(projectDir);
	const session = await loadSession(projectDir, sessionId, 0, 50);

	return {
		projectDir,
		displayName,
		sessionId,
		messages: session.messages,
		totalCount: session.totalCount,
		meta: session.meta ?? null,
		facets: session.facets ?? null,
		firstPrompt: session.firstPrompt
	};
};
