import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listAllCodexSessions } from '$lib/server/codex/readers/sessions.js';
import { readCodexHistory } from '$lib/server/codex/readers/history.js';

interface SearchResult {
	type: 'session' | 'command' | 'project';
	title: string;
	subtitle: string;
	href: string;
}

export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') || '').toLowerCase().trim();
	if (!q || q.length < 2) return json({ results: [] });

	const results: SearchResult[] = [];

	// Search sessions
	const sessions = await listAllCodexSessions();
	for (const session of sessions) {
		if (results.length >= 20) break;
		const match =
			session.firstPrompt?.toLowerCase().includes(q) ||
			session.cwd?.toLowerCase().includes(q) ||
			session.projectName?.toLowerCase().includes(q);
		if (match) {
			results.push({
				type: 'session',
				title: session.firstPrompt || session.sessionId,
				subtitle: `${session.projectName} - ${session.model}`,
				href: `/codex/sessions/${session.sessionId}`
			});
		}
	}

	// Search history
	const history = readCodexHistory();
	for (const entry of history) {
		if (results.length >= 20) break;
		if (entry.text.toLowerCase().includes(q)) {
			results.push({
				type: 'command',
				title: entry.text.slice(0, 100),
				subtitle: new Date(entry.ts * 1000).toLocaleString(),
				href: `/codex/sessions/${entry.session_id}`
			});
		}
	}

	return json({ results: results.slice(0, 20) });
};
