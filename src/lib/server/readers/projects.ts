import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { PROJECTS_DIR } from '../config.js';
import { decodeDirName, shortName } from '../parsers/path-codec.js';
import { readAllSessionMeta } from './session-meta.js';
import type { Project, SessionsIndex, SessionListItem, SessionMeta } from '../types.js';

export function listProjects(): Project[] {
	const dirs = readdirSync(PROJECTS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	const metaMap = readAllSessionMeta();
	const projects: Project[] = [];

	for (const dir of dirs) {
		const projectDir = join(PROJECTS_DIR, dir);
		const jsonlFiles = readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));
		if (jsonlFiles.length === 0) continue;

		const decodedPath = decodeDirName(dir);

		// Find the most recent mtime among session files
		let lastActive = '';
		for (const f of jsonlFiles) {
			try {
				const stat = statSync(join(projectDir, f));
				const mtime = stat.mtime.toISOString();
				if (!lastActive || mtime > lastActive) lastActive = mtime;
			} catch {
				// skip
			}
		}

		projects.push({
			dirName: dir,
			decodedPath,
			sessionCount: jsonlFiles.length,
			lastActive
		});
	}

	// Sort by last active (most recent first)
	projects.sort((a, b) => (b.lastActive > a.lastActive ? 1 : -1));
	return projects;
}

export function getProjectDisplayName(dirName: string): string {
	return shortName(decodeDirName(dirName));
}

export function listProjectSessions(dirName: string): SessionListItem[] {
	const projectDir = join(PROJECTS_DIR, dirName);
	const indexPath = join(projectDir, 'sessions-index.json');
	const metaMap = readAllSessionMeta();
	const decodedPath = decodeDirName(dirName);

	// Try sessions-index.json first
	if (existsSync(indexPath)) {
		try {
			const index: SessionsIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
			return index.entries.map((e) => {
				const meta = metaMap.get(e.sessionId);
				return mergeSessionData(e.sessionId, {
					firstPrompt: e.firstPrompt,
					summary: e.summary,
					messageCount: e.messageCount,
					created: e.created,
					modified: e.modified,
					gitBranch: e.gitBranch
				}, meta);
			}).sort((a, b) => (b.modified > a.modified ? 1 : -1));
		} catch {
			// Fall through to JSONL scan
		}
	}

	// Fallback: scan JSONL files + match with session-meta
	const jsonlFiles = readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));
	const sessions: SessionListItem[] = [];

	for (const file of jsonlFiles) {
		const sessionId = file.replace('.jsonl', '');
		const meta = metaMap.get(sessionId);
		const filePath = join(projectDir, file);

		let created = '';
		let modified = '';
		try {
			const stat = statSync(filePath);
			created = stat.birthtime.toISOString();
			modified = stat.mtime.toISOString();
		} catch {
			// skip
		}

		sessions.push(mergeSessionData(sessionId, {
			firstPrompt: meta?.first_prompt ?? '',
			summary: meta?.summary ?? '',
			messageCount: meta ? (meta.user_message_count + meta.assistant_message_count) : 0,
			created: meta?.start_time ?? created,
			modified,
			gitBranch: ''
		}, meta));
	}

	sessions.sort((a, b) => (b.modified > a.modified ? 1 : -1));
	return sessions;
}

function mergeSessionData(
	sessionId: string,
	base: {
		firstPrompt: string;
		summary: string;
		messageCount: number;
		created: string;
		modified: string;
		gitBranch: string;
	},
	meta?: SessionMeta
): SessionListItem {
	return {
		sessionId,
		firstPrompt: base.firstPrompt || meta?.first_prompt || '',
		summary: base.summary || meta?.summary || '',
		messageCount: base.messageCount || (meta ? meta.user_message_count + meta.assistant_message_count : 0),
		created: base.created || meta?.start_time || '',
		modified: base.modified,
		gitBranch: base.gitBranch || '',
		model: undefined,
		durationMinutes: meta?.duration_minutes,
		toolCounts: meta?.tool_counts,
		languages: meta?.languages,
		inputTokens: meta?.input_tokens,
		outputTokens: meta?.output_tokens,
		linesAdded: meta?.lines_added,
		linesRemoved: meta?.lines_removed
	};
}
