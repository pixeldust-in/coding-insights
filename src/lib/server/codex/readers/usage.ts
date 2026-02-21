import { readFileSync } from 'fs';
import { findAllSessionFiles } from './sessions.js';

interface CodexUsageData {
	five_hour?: { utilization: number; resets_at: string } | null;
	seven_day?: { utilization: number; resets_at: string } | null;
	last_updated?: string;
	error?: string;
}

export function readCodexUsage(): CodexUsageData {
	const files = findAllSessionFiles();
	if (files.length === 0) return {};

	// Files are sorted by path (YYYY/MM/DD), last entry is most recent
	const latestFile = files[files.length - 1];

	try {
		const content = readFileSync(latestFile, 'utf-8');
		const lines = content.trim().split('\n');

		// Read in reverse to find the last token_count event with rate_limits
		for (let i = lines.length - 1; i >= 0; i--) {
			try {
				const parsed = JSON.parse(lines[i]);
				if (parsed.type !== 'event_msg') continue;

				const payload = parsed.payload;
				if (payload?.type !== 'token_count' || !payload.rate_limits) continue;

				const rl = payload.rate_limits;
				const result: CodexUsageData = {};

				if (rl.primary) {
					result.five_hour = {
						utilization: rl.primary.used_percent ?? 0,
						resets_at: new Date(rl.primary.resets_at * 1000).toISOString()
					};
				}

				if (rl.secondary) {
					result.seven_day = {
						utilization: rl.secondary.used_percent ?? 0,
						resets_at: new Date(rl.secondary.resets_at * 1000).toISOString()
					};
				}

				if (parsed.timestamp) {
					result.last_updated = parsed.timestamp;
				}

				return result;
			} catch {
				// skip malformed lines
			}
		}
	} catch {
		return { error: 'Failed to read session file' };
	}

	return {};
}
