import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listProjects } from '$lib/server/readers/projects.js';
import { loadSessionMessages } from '$lib/server/readers/sessions.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { PROJECTS_DIR } from '$lib/server/config.js';

export const GET: RequestHandler = async ({ params, url }) => {
	const sessionId = params.session;
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const limit = parseInt(url.searchParams.get('limit') || '50', 10);

	// Find which project directory contains this session
	let projectDir: string | null = null;
	for (const p of listProjects()) {
		if (existsSync(join(PROJECTS_DIR, p.dirName, `${sessionId}.jsonl`))) {
			projectDir = p.dirName;
			break;
		}
	}

	if (!projectDir) throw error(404, 'Session not found');

	const result = await loadSessionMessages(projectDir, sessionId, offset, limit);
	return json(result);
};
