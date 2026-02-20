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

		// When meta is unavailable, parse JSONL for first prompt and counts
		let firstPrompt = meta?.first_prompt ?? '';
		let userCount = meta?.user_message_count ?? 0;
		let assistantCount = meta?.assistant_message_count ?? 0;

		if (!meta) {
			const parsed = parseJsonlBasicInfo(filePath);
			firstPrompt = parsed.firstPrompt;
			userCount = parsed.userCount;
			assistantCount = parsed.assistantCount;
		}

		sessions.push(mergeSessionData(sessionId, {
			firstPrompt,
			summary: meta?.summary ?? '',
			messageCount: userCount + assistantCount,
			created: meta?.start_time ?? created,
			modified,
			gitBranch: ''
		}, meta));
	}

	sessions.sort((a, b) => (b.modified > a.modified ? 1 : -1));
	return sessions;
}

function parseJsonlBasicInfo(filePath: string): {
	firstPrompt: string;
	userCount: number;
	assistantCount: number;
} {
	try {
		const content = readFileSync(filePath, 'utf-8');
		let firstPrompt = '';
		let userCount = 0;
		let assistantCount = 0;

		for (const line of content.split('\n')) {
			if (!line.trim()) continue;
			try {
				const obj = JSON.parse(line);
				if (obj.type === 'user') {
					const msg = obj.message;
					if (!msg?.content) continue;
					let text = '';
					if (typeof msg.content === 'string') {
						text = msg.content;
					} else if (Array.isArray(msg.content)) {
						text = msg.content
							.filter((b: { type: string }) => b.type === 'text')
							.map((b: { text: string }) => b.text)
							.join(' ');
					}
					// Skip command/system messages
					if (
						text.trim() &&
						!text.trim().startsWith('<command-name>') &&
						!text.trim().startsWith('<local-command')
					) {
						userCount++;
						if (!firstPrompt) {
							firstPrompt = text.trim().slice(0, 200);
						}
					}
				} else if (obj.type === 'assistant') {
					assistantCount++;
				}
			} catch {
				// skip malformed lines
			}
		}
		return { firstPrompt, userCount, assistantCount };
	} catch {
		return { firstPrompt: '', userCount: 0, assistantCount: 0 };
	}
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
