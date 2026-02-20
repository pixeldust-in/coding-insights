import type { PageServerLoad } from './$types';
import type { DailyProjectActivity, DailyProjectTokens, ProjectTokenUsage } from '$lib/server/types.js';
import { readStatsCache } from '$lib/server/readers/stats.js';
import { readAllSessionMeta } from '$lib/server/readers/session-meta.js';
import { shortName } from '$lib/server/parsers/path-codec.js';

export const load: PageServerLoad = async () => {
	const stats = readStatsCache();
	const metaMap = readAllSessionMeta();

	// Aggregate tool counts and languages across all sessions
	const toolCounts: Record<string, number> = {};
	const languages: Record<string, number> = {};

	// Per-project aggregation
	const projectDailyMap = new Map<string, Map<string, number>>(); // date -> (project -> messages)
	const projectDailyTokenMap = new Map<string, Map<string, { input: number; output: number }>>(); // date -> (project -> tokens)
	const projectTokenMap = new Map<string, { input: number; output: number }>(); // project -> tokens
	const projectTotalMessages = new Map<string, number>(); // project -> total messages

	for (const meta of metaMap.values()) {
		for (const [tool, count] of Object.entries(meta.tool_counts)) {
			toolCounts[tool] = (toolCounts[tool] || 0) + count;
		}
		for (const [lang, count] of Object.entries(meta.languages)) {
			languages[lang] = (languages[lang] || 0) + count;
		}

		// Project-level stats
		const project = meta.project_path ? shortName(meta.project_path) : 'Unknown';
		const messages = (meta.user_message_count || 0) + (meta.assistant_message_count || 0);
		const date = meta.start_time?.split('T')[0];

		if (date) {
			if (!projectDailyMap.has(date)) projectDailyMap.set(date, new Map());
			const dayMap = projectDailyMap.get(date)!;
			dayMap.set(project, (dayMap.get(project) || 0) + messages);

			if (!projectDailyTokenMap.has(date)) projectDailyTokenMap.set(date, new Map());
			const dayTokenMap = projectDailyTokenMap.get(date)!;
			const dayTokens = dayTokenMap.get(project) || { input: 0, output: 0 };
			dayTokens.input += meta.input_tokens || 0;
			dayTokens.output += meta.output_tokens || 0;
			dayTokenMap.set(project, dayTokens);
		}

		const tokens = projectTokenMap.get(project) || { input: 0, output: 0 };
		tokens.input += meta.input_tokens || 0;
		tokens.output += meta.output_tokens || 0;
		projectTokenMap.set(project, tokens);

		projectTotalMessages.set(project, (projectTotalMessages.get(project) || 0) + messages);
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

	// Compute total tokens
	let totalTokens = 0;
	for (const usage of Object.values(stats.modelUsage)) {
		totalTokens += usage.inputTokens + usage.outputTokens;
	}

	// Count active days
	const activeDays = stats.dailyActivity.length;

	return {
		stats,
		toolCounts,
		languages,
		totalTokens,
		activeDays,
		dailyProjectActivity,
		dailyProjectTokens,
		projectTokenUsage
	};
};
