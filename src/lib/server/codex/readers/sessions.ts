import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { CODEX_SESSIONS_DIR } from '../config.js';
import { streamCodexSessionMessages, scanCodexSessionMeta } from '../parsers/codex-jsonl.js';
import type { CodexSessionListItem } from '../types.js';
import type { ConversationMessage } from '../../types.js';

let cachedSessions: CodexSessionListItem[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

function findAllSessionFiles(): string[] {
	const files: string[] = [];

	if (!existsSync(CODEX_SESSIONS_DIR)) return files;

	// Walk YYYY/MM/DD structure
	try {
		for (const year of readdirSync(CODEX_SESSIONS_DIR)) {
			const yearDir = join(CODEX_SESSIONS_DIR, year);
			if (!statSync(yearDir).isDirectory()) continue;

			for (const month of readdirSync(yearDir)) {
				const monthDir = join(yearDir, month);
				if (!statSync(monthDir).isDirectory()) continue;

				for (const day of readdirSync(monthDir)) {
					const dayDir = join(monthDir, day);
					if (!statSync(dayDir).isDirectory()) continue;

					for (const file of readdirSync(dayDir)) {
						if (file.endsWith('.jsonl')) {
							files.push(join(dayDir, file));
						}
					}
				}
			}
		}
	} catch {
		// partial read is fine
	}

	return files;
}

export async function listAllCodexSessions(): Promise<CodexSessionListItem[]> {
	const now = Date.now();
	if (cachedSessions && now - cacheTime < CACHE_TTL) {
		return cachedSessions;
	}

	const files = findAllSessionFiles();
	const sessions: CodexSessionListItem[] = [];

	for (const filePath of files) {
		const meta = await scanCodexSessionMeta(filePath);
		if (meta) sessions.push(meta);
	}

	// Sort by timestamp descending
	sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	cachedSessions = sessions;
	cacheTime = now;
	return sessions;
}

export function findSessionFile(sessionId: string): string | null {
	const files = findAllSessionFiles();
	return files.find((f) => f.includes(sessionId)) || null;
}

export async function loadCodexSession(
	sessionId: string,
	offset = 0,
	limit = 50
): Promise<{ messages: ConversationMessage[]; totalCount: number } | null> {
	const filePath = findSessionFile(sessionId);
	if (!filePath) return null;
	return streamCodexSessionMessages(filePath, { offset, limit });
}

export async function loadCodexSessionMessages(
	sessionId: string,
	offset: number,
	limit: number
): Promise<{ messages: ConversationMessage[]; totalCount: number }> {
	const filePath = findSessionFile(sessionId);
	if (!filePath) return { messages: [], totalCount: 0 };
	return streamCodexSessionMessages(filePath, { offset, limit });
}
