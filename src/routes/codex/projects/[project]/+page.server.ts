import type { PageServerLoad } from './$types';
import { listAllCodexSessions } from '$lib/server/codex/readers/sessions.js';
import { shortName } from '$lib/server/parsers/path-codec.js';

export const load: PageServerLoad = async ({ params }) => {
	const cwd = decodeURIComponent(params.project);
	const allSessions = await listAllCodexSessions();
	const sessions = allSessions.filter((s) => s.cwd === cwd);
	const displayName = shortName(cwd);

	return {
		cwd,
		displayName,
		sessions
	};
};
