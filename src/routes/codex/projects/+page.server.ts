import type { PageServerLoad } from './$types';
import { listAllCodexSessions } from '$lib/server/codex/readers/sessions.js';
import { shortName } from '$lib/server/parsers/path-codec.js';

export interface CodexProject {
	cwd: string;
	displayName: string;
	sessionCount: number;
	messageCount: number;
	lastActive: string;
}

export const load: PageServerLoad = async () => {
	const sessions = await listAllCodexSessions();

	// Group sessions by cwd
	const projectMap = new Map<string, { sessionCount: number; messageCount: number; lastActive: string }>();

	for (const session of sessions) {
		const existing = projectMap.get(session.cwd);
		if (existing) {
			existing.sessionCount++;
			existing.messageCount += session.messageCount;
			if (session.timestamp > existing.lastActive) {
				existing.lastActive = session.timestamp;
			}
		} else {
			projectMap.set(session.cwd, {
				sessionCount: 1,
				messageCount: session.messageCount,
				lastActive: session.timestamp
			});
		}
	}

	const projects: CodexProject[] = [];
	for (const [cwd, data] of projectMap) {
		projects.push({
			cwd,
			displayName: shortName(cwd),
			...data
		});
	}

	// Sort by last active descending
	projects.sort((a, b) => (b.lastActive > a.lastActive ? 1 : -1));

	return { projects };
};
