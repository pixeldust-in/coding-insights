import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadSessionMessages } from '$lib/server/readers/sessions.js';

export const GET: RequestHandler = async ({ params, url }) => {
	const { project: projectDir, session: sessionId } = params;
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const limit = parseInt(url.searchParams.get('limit') || '50', 10);

	const result = await loadSessionMessages(projectDir, sessionId, offset, limit);
	return json(result);
};
