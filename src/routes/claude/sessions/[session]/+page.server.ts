import type { PageServerLoad } from './$types';
import { listProjects, getProjectDisplayName } from '$lib/server/readers/projects.js';
import { loadSession } from '$lib/server/readers/sessions.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { PROJECTS_DIR } from '$lib/server/config.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const sessionId = params.session;

	// Find which project directory contains this session
	let projectDir: string | null = null;
	for (const p of listProjects()) {
		if (existsSync(join(PROJECTS_DIR, p.dirName, `${sessionId}.jsonl`))) {
			projectDir = p.dirName;
			break;
		}
	}

	if (!projectDir) throw error(404, 'Session not found');

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
		firstPrompt: session.firstPrompt,
		activeDurationMinutes: session.activeDurationMinutes
	};
};
