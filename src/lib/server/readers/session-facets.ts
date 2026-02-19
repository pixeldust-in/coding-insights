import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { SESSION_FACETS_DIR } from '../config.js';
import type { SessionFacets } from '../types.js';

let facetsCache: Map<string, SessionFacets> | null = null;

export function readAllSessionFacets(): Map<string, SessionFacets> {
	if (facetsCache) return facetsCache;

	facetsCache = new Map();
	try {
		const files = readdirSync(SESSION_FACETS_DIR).filter((f) => f.endsWith('.json'));
		for (const file of files) {
			try {
				const data: SessionFacets = JSON.parse(
					readFileSync(join(SESSION_FACETS_DIR, file), 'utf-8')
				);
				facetsCache.set(data.session_id, data);
			} catch {
				// Skip corrupt files
			}
		}
	} catch {
		// Directory may not exist
	}
	return facetsCache;
}

export function getSessionFacets(sessionId: string): SessionFacets | undefined {
	return readAllSessionFacets().get(sessionId);
}
