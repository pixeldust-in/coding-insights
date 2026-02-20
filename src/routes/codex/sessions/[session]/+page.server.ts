import type { PageServerLoad } from './$types';
import { loadCodexSession, listAllCodexSessions } from '$lib/server/codex/readers/sessions.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const sessionId = params.session;
	const result = await loadCodexSession(sessionId, 0, 50);
	if (!result) throw error(404, 'Session not found');

	// Find session meta for additional info
	const sessions = await listAllCodexSessions();
	const meta = sessions.find((s) => s.sessionId === sessionId);

	return {
		sessionId,
		messages: result.messages,
		totalCount: result.totalCount,
		meta: meta ?? null
	};
};
