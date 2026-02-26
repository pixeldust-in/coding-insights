import { listAllCodexSessions, findSessionFile } from './sessions.js';
import { fullScanCodexSession } from '../parsers/codex-jsonl.js';
import { shortName } from '../../parsers/path-codec.js';
import type { CodexDashboardStats } from '../types.js';
import type { DailyProjectActivity, DailyProjectTokens, ProjectTokenUsage } from '../../types.js';

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
	const languages: Record<string, number> = {};
	const modelTokens: Record<string, { input: number; output: number; reasoning: number }> = {};
	const dailyModelTokenMap = new Map<string, Map<string, number>>(); // date -> (model -> totalTokens)

	// Per-project tracking
	const projectDailyMap = new Map<string, Map<string, number>>(); // date -> (project -> messages)
	const projectDailyTokenMap = new Map<string, Map<string, { input: number; output: number }>>(); // date -> (project -> tokens)
	const projectTokenMap = new Map<string, { input: number; output: number }>(); // project -> tokens
	const projectTotalMessages = new Map<string, number>(); // project -> total messages

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

		// Languages
		for (const [lang, count] of Object.entries(scan.languages)) {
			languages[lang] = (languages[lang] || 0) + count;
		}

		// Model tokens
		const model = session.model;
		if (model) {
			if (!modelTokens[model]) {
				modelTokens[model] = { input: 0, output: 0, reasoning: 0 };
			}
			modelTokens[model].input += scan.totalInputTokens;
			modelTokens[model].output += scan.totalOutputTokens;
			modelTokens[model].reasoning += scan.totalReasoningTokens;

			// Daily model tokens
			if (!dailyModelTokenMap.has(date)) dailyModelTokenMap.set(date, new Map());
			const dayModelMap = dailyModelTokenMap.get(date)!;
			dayModelMap.set(model, (dayModelMap.get(model) || 0) + scan.totalInputTokens + scan.totalOutputTokens);
		}

		// Per-project stats
		const project = session.cwd ? shortName(session.cwd) : 'Unknown';
		if (!projectDailyMap.has(date)) projectDailyMap.set(date, new Map());
		const dayMap = projectDailyMap.get(date)!;
		dayMap.set(project, (dayMap.get(project) || 0) + scan.messageCount);

		if (!projectDailyTokenMap.has(date)) projectDailyTokenMap.set(date, new Map());
		const dayTokenMap = projectDailyTokenMap.get(date)!;
		const dayTokens = dayTokenMap.get(project) || { input: 0, output: 0 };
		dayTokens.input += scan.totalInputTokens;
		dayTokens.output += scan.totalOutputTokens;
		dayTokenMap.set(project, dayTokens);

		const tokens = projectTokenMap.get(project) || { input: 0, output: 0 };
		tokens.input += scan.totalInputTokens;
		tokens.output += scan.totalOutputTokens;
		projectTokenMap.set(project, tokens);

		projectTotalMessages.set(project, (projectTotalMessages.get(project) || 0) + scan.messageCount);
	}

	// Top 8 projects by total messages, rest collapsed into "Other"
	const sortedProjects = Array.from(projectTotalMessages.entries())
		.sort((a, b) => b[1] - a[1]);
	const topProjects = new Set(sortedProjects.slice(0, 8).map(([p]) => p));

	function resolveProject(p: string): string {
		return topProjects.has(p) ? p : 'Other';
	}

	const dailyProjectActivity: DailyProjectActivity[] = Array.from(projectDailyMap.entries())
		.map(([date, dayMap]) => {
			const byProject: Record<string, number> = {};
			for (const [project, count] of dayMap) {
				const resolved = resolveProject(project);
				byProject[resolved] = (byProject[resolved] || 0) + count;
			}
			return { date, byProject };
		})
		.sort((a, b) => a.date.localeCompare(b.date));

	const dailyProjectTokens: DailyProjectTokens[] = Array.from(projectDailyTokenMap.entries())
		.map(([date, dayMap]) => {
			const byProject: Record<string, { input: number; output: number }> = {};
			for (const [project, tokens] of dayMap) {
				const resolved = resolveProject(project);
				if (!byProject[resolved]) byProject[resolved] = { input: 0, output: 0 };
				byProject[resolved].input += tokens.input;
				byProject[resolved].output += tokens.output;
			}
			return { date, byProject };
		})
		.sort((a, b) => a.date.localeCompare(b.date));

	const collapsedTokens = new Map<string, { input: number; output: number }>();
	for (const [project, tokens] of projectTokenMap) {
		const resolved = resolveProject(project);
		const existing = collapsedTokens.get(resolved) || { input: 0, output: 0 };
		existing.input += tokens.input;
		existing.output += tokens.output;
		collapsedTokens.set(resolved, existing);
	}

	const projectTokenUsage: ProjectTokenUsage[] = Array.from(collapsedTokens.entries())
		.map(([project, tokens]) => ({
			project,
			totalTokens: tokens.input + tokens.output,
			inputTokens: tokens.input,
			outputTokens: tokens.output
		}))
		.sort((a, b) => b.totalTokens - a.totalTokens);

	const dailyModelTokens = Array.from(dailyModelTokenMap.entries())
		.map(([date, modelMap]) => {
			const tokensByModel: Record<string, number> = {};
			for (const [model, total] of modelMap) {
				tokensByModel[model] = total;
			}
			return { date, tokensByModel };
		})
		.sort((a, b) => a.date.localeCompare(b.date));

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
		dailyModelTokens,
		hourCounts,
		functionCallCounts,
		languages,
		modelTokens,
		firstSessionDate,
		dailyProjectActivity,
		dailyProjectTokens,
		projectTokenUsage
	};

	cachedStats = stats;
	cacheTime = now;
	return stats;
}
