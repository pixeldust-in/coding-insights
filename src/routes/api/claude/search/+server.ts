import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readAllSessionMeta } from '$lib/server/readers/session-meta.js';
import { readCommands } from '$lib/server/readers/commands.js';
import { listProjects } from '$lib/server/readers/projects.js';
import { decodeDirName } from '$lib/server/parsers/path-codec.js';

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

	// Search sessions via meta
	const metaMap = readAllSessionMeta();
	for (const meta of metaMap.values()) {
		if (results.length >= 20) break;
		const match =
			meta.first_prompt?.toLowerCase().includes(q) ||
			meta.summary?.toLowerCase().includes(q);
		if (match) {
			// Find the project dir for this session
			const projectDir = findProjectDirForPath(meta.project_path);
			results.push({
				type: 'session',
				title: meta.first_prompt || meta.summary || meta.session_id,
				subtitle: meta.summary || meta.project_path,
				href: projectDir
					? `/claude/projects/${encodeURIComponent(projectDir)}/${meta.session_id}`
					: '#'
			});
		}
	}

	// Search commands
	const commands = readCommands();
	for (const cmd of commands) {
		if (
			cmd.name.toLowerCase().includes(q) ||
			cmd.description.toLowerCase().includes(q)
		) {
			results.push({
				type: 'command',
				title: `/${cmd.name}`,
				subtitle: cmd.description,
				href: '/claude/commands'
			});
		}
	}

	// Search projects
	const projects = listProjects();
	for (const p of projects) {
		if (p.decodedPath.toLowerCase().includes(q)) {
			results.push({
				type: 'project',
				title: p.decodedPath.split('/').slice(-2).join('/'),
				subtitle: `${p.sessionCount} sessions`,
				href: `/claude/projects/${encodeURIComponent(p.dirName)}`
			});
		}
	}

	return json({ results: results.slice(0, 20) });
};

// Mapping project_path to encoded dir name
function findProjectDirForPath(projectPath: string): string | null {
	const projects = listProjects();
	for (const p of projects) {
		if (p.decodedPath === projectPath || decodeDirName(p.dirName) === projectPath) {
			return p.dirName;
		}
	}
	// Fallback: try encoding the path
	const encoded = projectPath.replace(/\//g, '-');
	return encoded;
}
