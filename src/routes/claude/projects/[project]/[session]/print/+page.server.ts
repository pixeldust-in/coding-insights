import type { PageServerLoad } from './$types';
import { loadSession } from '$lib/server/readers/sessions.js';
import { getProjectDisplayName } from '$lib/server/readers/projects.js';

export const load: PageServerLoad = async ({ params, url }) => {
	const { project: projectDir, session: sessionId } = params;
	const displayName = getProjectDisplayName(projectDir);
	const session = await loadSession(projectDir, sessionId, 0, Number.MAX_SAFE_INTEGER);

	return {
		projectDir,
		displayName,
		sessionId,
		hideTools: url.searchParams.get('hideTools') === '1',
		messages: session.messages,
		totalCount: session.totalCount,
		meta: session.meta ?? null,
		firstPrompt: session.firstPrompt
	};
};
