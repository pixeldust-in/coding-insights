import type { PageServerLoad } from './$types';
import { listAllCodexSessions, findSessionFile } from '$lib/server/codex/readers/sessions.js';
import { fullScanCodexSession } from '$lib/server/codex/parsers/codex-jsonl.js';
import { shortName } from '$lib/server/parsers/path-codec.js';

export const load: PageServerLoad = async ({ params }) => {
	const cwd = decodeURIComponent(params.project);
	const allSessions = await listAllCodexSessions();
	const sessions = allSessions.filter((s) => s.cwd === cwd);
	const displayName = shortName(cwd);

	// Full-scan each session for tokens, tool calls, duration
	let totalMessages = 0;
	let totalTokens = 0;
	let totalToolCalls = 0;
	let totalDurationMinutes = 0;

	const scanPromises = sessions.map(async (s) => {
		const filePath = findSessionFile(s.sessionId);
		if (!filePath) return null;
		return fullScanCodexSession(filePath);
	});
	const scans = await Promise.all(scanPromises);

	for (let i = 0; i < sessions.length; i++) {
		const scan = scans[i];
		if (!scan) {
			totalMessages += sessions[i].messageCount;
			continue;
		}
		totalMessages += scan.messageCount;
		totalTokens += scan.totalInputTokens + scan.totalOutputTokens;
		const toolCalls = Object.values(scan.functionCallCounts).reduce((a, b) => a + b, 0);
		totalToolCalls += toolCalls;
	}

	// Estimate duration from first→last session timestamp span
	if (sessions.length > 0) {
		const sorted = [...sessions].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		);
		for (const s of sorted) {
			// Each session's duration: approximate from timestamp differences
			// Use a minimum of 5 min per session as a rough estimate
			totalDurationMinutes += 5;
		}
		// Better: use first-to-last timestamp span if multiple sessions
		const first = new Date(sorted[0].timestamp).getTime();
		const last = new Date(sorted[sorted.length - 1].timestamp).getTime();
		const spanMinutes = (last - first) / 60_000;
		if (spanMinutes > totalDurationMinutes) {
			totalDurationMinutes = Math.round(spanMinutes);
		}
	}

	return {
		cwd,
		displayName,
		sessions,
		metrics: {
			totalMessages,
			totalTokens,
			totalToolCalls,
			totalDurationMinutes
		}
	};
};
