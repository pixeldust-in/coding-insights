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

	const projects: Project[] = [];

	for (const dir of dirs) {
		const projectDir = join(PROJECTS_DIR, dir);
		const { sessionIds, lastActive } = collectProjectSessionSummary(projectDir);
		if (sessionIds.size === 0) continue;

		projects.push({
			dirName: dir,
			decodedPath: decodeDirName(dir),
			sessionCount: sessionIds.size,
			lastActive
		});
	}

	// Sort by last active (most recent first)
	projects.sort((a, b) => (b.lastActive > a.lastActive ? 1 : -1));
	return projects;
}

/**
 * Claude Code stores session metadata in two places that must be merged:
 * - `<sessionId>.jsonl` files in the project dir (current sessions with full transcript)
 * - `sessions-index.json` entries (older sessions whose .jsonl was archived/removed)
 * Neither source is authoritative on its own: recent sessions may not yet appear in
 * the index, and older sessions are only in the index. Dedupe by session id.
 */
function collectProjectSessionSummary(projectDir: string): {
	sessionIds: Set<string>;
	lastActive: string;
} {
	const sessionIds = new Set<string>();
	let lastActive = '';

	try {
		const entries = readdirSync(projectDir);
		for (const f of entries) {
			if (!f.endsWith('.jsonl')) continue;
			sessionIds.add(f.replace(/\.jsonl$/, ''));
			try {
				const mtime = statSync(join(projectDir, f)).mtime.toISOString();
				if (mtime > lastActive) lastActive = mtime;
			} catch {
				// skip
			}
		}
	} catch {
		// skip
	}

	const indexPath = join(projectDir, 'sessions-index.json');
	if (existsSync(indexPath)) {
		try {
			const index: SessionsIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
			for (const e of index.entries) {
				sessionIds.add(e.sessionId);
				if (e.modified && e.modified > lastActive) lastActive = e.modified;
			}
		} catch {
			// skip
		}
	}

	return { sessionIds, lastActive };
}

export function getProjectDisplayName(dirName: string): string {
	return shortName(decodeDirName(dirName));
}

export function listAllSessions(): SessionListItem[] {
	const projects = listProjects();
	const all: SessionListItem[] = [];
	for (const p of projects) {
		const sessions = listProjectSessions(p.dirName);
		const name = getProjectDisplayName(p.dirName);
		for (const s of sessions) {
			all.push({ ...s, projectName: name, projectDir: p.dirName });
		}
	}
	all.sort((a, b) => (b.modified > a.modified ? 1 : -1));
	return all;
}

export function listProjectSessions(dirName: string): SessionListItem[] {
	const projectDir = join(PROJECTS_DIR, dirName);
	const indexPath = join(projectDir, 'sessions-index.json');
	const metaMap = readAllSessionMeta();
	const sessions = new Map<string, SessionListItem>();

	// 1. Pull entries from sessions-index.json (older, possibly archived sessions)
	if (existsSync(indexPath)) {
		try {
			const index: SessionsIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
			for (const e of index.entries) {
				const meta = metaMap.get(e.sessionId);
				const jsonlPath = join(projectDir, `${e.sessionId}.jsonl`);
				const parsed = existsSync(jsonlPath) ? parseJsonlInfo(jsonlPath) : undefined;
				sessions.set(e.sessionId, mergeSessionData(e.sessionId, {
					firstPrompt: e.firstPrompt,
					summary: e.summary,
					messageCount: e.messageCount,
					created: e.created,
					modified: e.modified,
					gitBranch: e.gitBranch
				}, meta, parsed));
			}
		} catch {
			// ignore malformed index; JSONL scan below still runs
		}
	}

	// 2. Scan JSONL files — these are the current/recent sessions that may not
	//    yet be recorded in sessions-index.json. Skip ids already captured above.
	let jsonlFiles: string[] = [];
	try {
		jsonlFiles = readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));
	} catch {
		jsonlFiles = [];
	}

	for (const file of jsonlFiles) {
		const sessionId = file.replace(/\.jsonl$/, '');
		if (sessions.has(sessionId)) continue;

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

		const parsed = parseJsonlInfo(filePath);
		const firstPrompt = meta?.first_prompt ?? parsed.firstPrompt;
		const userCount = meta?.user_message_count ?? parsed.userCount;
		const assistantCount = meta?.assistant_message_count ?? parsed.assistantCount;

		sessions.set(sessionId, mergeSessionData(sessionId, {
			firstPrompt,
			summary: meta?.summary ?? '',
			messageCount: userCount + assistantCount,
			created: meta?.start_time ?? created,
			modified,
			gitBranch: ''
		}, meta, parsed));
	}

	return [...sessions.values()].sort((a, b) => (b.modified > a.modified ? 1 : -1));
}

interface ParsedJsonlInfo {
	firstPrompt: string;
	sessionName: string;
	userCount: number;
	assistantCount: number;
	inputTokens: number;
	outputTokens: number;
	durationMinutes: number;
}

/** Extract a user-assigned session name from the "named this session" reminder text */
function extractSessionName(text: string | undefined): string {
	const m = text?.match(/named this session "([^"]+)"/);
	return m ? m[1].trim() : '';
}

/**
 * Turn raw user-message text into a clean prompt preview.
 * Surfaces slash-command arguments, and drops system reminders / meta wrappers
 * that would otherwise show up as noisy `<system-reminder>…` / `<command-message>…` rows.
 */
function cleanPromptPreview(text: string | undefined): string {
	const t = (text ?? '').trim();
	if (!t) return '';
	if (t.startsWith('<command-message>') || t.startsWith('<command-name>')) {
		const args = t.match(/<command-args>([\s\S]*?)<\/command-args>/);
		if (args && args[1].trim()) return args[1].trim();
		const name = t.match(/<command-name>([\s\S]*?)<\/command-name>/);
		if (name && name[1].trim()) return name[1].trim();
		return '';
	}
	if (t.startsWith('<system-reminder') || t.startsWith('<local-command')) return '';
	return t;
}

function parseJsonlInfo(filePath: string): ParsedJsonlInfo {
	try {
		const content = readFileSync(filePath, 'utf-8');
		let firstPrompt = '';
		let sessionName = '';
		let userCount = 0;
		let assistantCount = 0;
		let inputTokens = 0;
		let outputTokens = 0;
		const timestamps: number[] = [];

		for (const line of content.split('\n')) {
			if (!line.trim()) continue;
			try {
				const obj = JSON.parse(line);
				const ts = obj.timestamp;
				if (ts) {
					const t = new Date(ts).getTime();
					if (!isNaN(t)) timestamps.push(t);
				}
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
					text = text.trim();
					if (!text) continue;

					// Capture the user-assigned session name (lives in an isMeta reminder)
					if (!sessionName) sessionName = extractSessionName(text);

					// Skip command/system messages when counting + previewing
					if (
						!text.startsWith('<command-name>') &&
						!text.startsWith('<local-command')
					) {
						userCount++;
						if (!firstPrompt) {
							firstPrompt = cleanPromptPreview(text).slice(0, 200);
						}
					}
				} else if (obj.type === 'assistant') {
					assistantCount++;
					const usage = obj.message?.usage;
					if (usage) {
						inputTokens += (usage.input_tokens ?? 0)
							+ (usage.cache_read_input_tokens ?? 0)
							+ (usage.cache_creation_input_tokens ?? 0);
						outputTokens += usage.output_tokens ?? 0;
					}
				}
			} catch {
				// skip malformed lines
			}
		}

		const durationMinutes = computeActiveDuration(timestamps);

		return { firstPrompt, sessionName, userCount, assistantCount, inputTokens, outputTokens, durationMinutes };
	} catch {
		return { firstPrompt: '', sessionName: '', userCount: 0, assistantCount: 0, inputTokens: 0, outputTokens: 0, durationMinutes: 0 };
	}
}

/** Compute active duration from timestamps: sum gaps ≤ 5 min, return minutes */
export function computeActiveDuration(timestamps: number[]): number {
	const MAX_GAP_MS = 5 * 60 * 1000;
	let totalMs = 0;
	for (let i = 1; i < timestamps.length; i++) {
		const gap = timestamps[i] - timestamps[i - 1];
		if (gap <= MAX_GAP_MS) {
			totalMs += gap;
		}
	}
	return totalMs / 60000;
}

/** Read a JSONL file and compute active duration (minutes) from its timestamps */
export function getActiveDurationFromJsonl(filePath: string): number {
	try {
		const content = readFileSync(filePath, 'utf-8');
		const timestamps: number[] = [];
		for (const line of content.split('\n')) {
			if (!line.trim()) continue;
			try {
				const obj = JSON.parse(line);
				const ts = obj.timestamp;
				if (ts) {
					const t = new Date(ts).getTime();
					if (!isNaN(t)) timestamps.push(t);
				}
			} catch {
				// skip malformed lines
			}
		}
		return computeActiveDuration(timestamps);
	} catch {
		return 0;
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
	meta?: SessionMeta,
	parsed?: ParsedJsonlInfo
): SessionListItem {
	const rawFirst = base.firstPrompt || meta?.first_prompt || parsed?.firstPrompt || '';
	const firstPrompt = cleanPromptPreview(rawFirst) || parsed?.firstPrompt || '';
	const sessionName = parsed?.sessionName || extractSessionName(rawFirst);
	return {
		sessionId,
		firstPrompt,
		sessionName: sessionName || undefined,
		summary: base.summary || meta?.summary || '',
		messageCount: base.messageCount || (meta ? meta.user_message_count + meta.assistant_message_count : 0),
		created: base.created || meta?.start_time || '',
		modified: base.modified,
		gitBranch: base.gitBranch || '',
		model: undefined,
		durationMinutes: parsed?.durationMinutes ?? meta?.duration_minutes,
		toolCounts: meta?.tool_counts,
		languages: meta?.languages,
		inputTokens: meta?.input_tokens ?? parsed?.inputTokens,
		outputTokens: meta?.output_tokens ?? parsed?.outputTokens,
		linesAdded: meta?.lines_added,
		linesRemoved: meta?.lines_removed
	};
}
