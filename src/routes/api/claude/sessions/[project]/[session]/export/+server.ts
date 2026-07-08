import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadFullSession } from '$lib/server/readers/sessions.js';
import { getSessionMeta } from '$lib/server/readers/session-meta.js';
import { getProjectDisplayName } from '$lib/server/readers/projects.js';
import { sessionToMarkdown } from '$lib/server/exporters/session-markdown.js';

export const GET: RequestHandler = async ({ params }) => {
	const { project: projectDir, session: sessionId } = params;

	const { messages } = await loadFullSession(projectDir, sessionId);
	if (messages.length === 0) throw error(404, 'Session transcript not found');

	const markdown = sessionToMarkdown({
		sessionId,
		projectName: getProjectDisplayName(projectDir),
		messages,
		meta: getSessionMeta(sessionId)
	});

	return new Response(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Content-Disposition': `attachment; filename="claude-session-${sessionId.slice(0, 8)}.md"`
		}
	});
};
