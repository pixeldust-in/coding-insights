import { listAllCodexSessions, findSessionFile } from './sessions.js';
import { fullScanCodexSession } from '../parsers/codex-jsonl.js';
import type { CodexDashboardStats } from '../types.js';

let cachedStats: CodexDashboardStats | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 60 seconds

export async function computeCodexStats(): Promise<CodexDashboardStats> {
	const now = Date.now();
	if (cachedStats && now - cacheTime < CACHE_TTL) {
		return cachedStats;
	}

	const sessions = await listAllCodexSessions();

	let totalMessages = 0;
	let totalTokens = 0;
	const dailyMap = new Map<string, { sessionCount: number; messageCount: number }>();
	const hourCounts: Record<string, number> = {};
	const functionCallCounts: Record<string, number> = {};
	const modelTokens: Record<string, { input: number; output: number; reasoning: number }> = {};

	for (const session of sessions) {
		const filePath = findSessionFile(session.sessionId);
		if (!filePath) continue;

		const scan = await fullScanCodexSession(filePath);
		totalMessages += scan.messageCount;
		totalTokens += scan.totalInputTokens + scan.totalOutputTokens;

		// Daily activity
		const date = session.timestamp.split('T')[0];
		const daily = dailyMap.get(date) || { sessionCount: 0, messageCount: 0 };
		daily.sessionCount++;
		daily.messageCount += scan.messageCount;
		dailyMap.set(date, daily);

		// Hour counts
		if (scan.hourOfDay !== null) {
			const h = String(scan.hourOfDay);
			hourCounts[h] = (hourCounts[h] || 0) + 1;
		}

		// Function call counts
		for (const [name, count] of Object.entries(scan.functionCallCounts)) {
			functionCallCounts[name] = (functionCallCounts[name] || 0) + count;
		}

		// Model tokens
		const model = session.model || 'unknown';
		if (!modelTokens[model]) {
			modelTokens[model] = { input: 0, output: 0, reasoning: 0 };
		}
		modelTokens[model].input += scan.totalInputTokens;
		modelTokens[model].output += scan.totalOutputTokens;
		modelTokens[model].reasoning += scan.totalReasoningTokens;
	}

	const dailyActivity = Array.from(dailyMap.entries())
		.map(([date, data]) => ({ date, ...data }))
		.sort((a, b) => a.date.localeCompare(b.date));

	const firstSessionDate = sessions.length > 0
		? sessions[sessions.length - 1].timestamp
		: new Date().toISOString();

	const stats: CodexDashboardStats = {
		totalSessions: sessions.length,
		totalMessages,
		totalTokens,
		activeDays: dailyMap.size,
		dailyActivity,
		hourCounts,
		functionCallCounts,
		modelTokens,
		firstSessionDate
	};

	cachedStats = stats;
	cacheTime = now;
	return stats;
}
