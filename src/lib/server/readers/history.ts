import { readFileSync } from 'fs';
import { HISTORY_PATH } from '../config.js';
import { getCached } from '../cache.js';
import type { HistoryEntry } from '../types.js';

export function readHistory(): HistoryEntry[] {
	return getCached(HISTORY_PATH, () => {
		const raw = readFileSync(HISTORY_PATH, 'utf-8');
		const entries: HistoryEntry[] = [];
		for (const line of raw.split('\n')) {
			if (!line.trim()) continue;
			try {
				entries.push(JSON.parse(line));
			} catch {
				// Skip corrupt lines
			}
		}
		return entries;
	});
}
