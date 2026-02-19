import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { SESSION_META_DIR } from '../config.js';
import type { SessionMeta } from '../types.js';

let metaCache: Map<string, SessionMeta> | null = null;

export function readAllSessionMeta(): Map<string, SessionMeta> {
	if (metaCache) return metaCache;

	metaCache = new Map();
	try {
		const files = readdirSync(SESSION_META_DIR).filter((f) => f.endsWith('.json'));
		for (const file of files) {
			try {
				const data: SessionMeta = JSON.parse(
					readFileSync(join(SESSION_META_DIR, file), 'utf-8')
				);
				metaCache.set(data.session_id, data);
			} catch {
				// Skip corrupt files
			}
		}
	} catch {
		// Directory may not exist
	}
	return metaCache;
}

export function getSessionMeta(sessionId: string): SessionMeta | undefined {
	return readAllSessionMeta().get(sessionId);
}

export function getSessionMetaByProject(projectPath: string): SessionMeta[] {
	const all = readAllSessionMeta();
	return Array.from(all.values()).filter((m) => m.project_path === projectPath);
}
