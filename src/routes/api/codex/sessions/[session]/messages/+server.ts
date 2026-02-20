import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadCodexSessionMessages } from '$lib/server/codex/readers/sessions.js';

export const GET: RequestHandler = async ({ params, url }) => {
	const sessionId = params.session;
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const limit = parseInt(url.searchParams.get('limit') || '50', 10);

	const result = await loadCodexSessionMessages(sessionId, offset, limit);
	return json(result);
};
