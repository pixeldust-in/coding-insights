import { createReadStream, readdirSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import { PROJECTS_DIR } from '../config.js';
import { getCachedAsync } from '../cache.js';
import { decodeDirName, shortName } from '../parsers/path-codec.js';
import { computeActiveDuration } from './projects.js';
import type {
	StatsCache,
	ModelUsage,
	DailyProjectActivity,
	DailyProjectTokens,
	ProjectTokenUsage
} from '../types.js';

/**
 * The complete payload the Claude dashboard page consumes. Historically these
 * fields were stitched together from `~/.claude/stats-cache.json` (model/activity
 * series) and `~/.claude/usage-data/session-meta/*.json` (per-project series, tool
 * and language counts). Both are written by the Claude Code CLI's telemetry job,
 * which stopped producing them — leaving the charts blank. We now derive everything
 * on demand from the raw session transcripts under ~/.claude/projects/, which are
 * always present and current.
 */
export interface ComputedDashboardData {
	stats: StatsCache;
	toolCounts: Record<string, number>;
	languages: Record<string, number>;
	totalTokens: number;
	activeDays: number;
	dailyProjectActivity: DailyProjectActivity[];
	dailyProjectTokens: DailyProjectTokens[];
	projectTokenUsage: ProjectTokenUsage[];
}

interface SessionScan {
	sessionId: string;
	date: string; // YYYY-MM-DD of session start, '' when the file has no timestamps
	hour: number | null; // local hour of session start
	messageCount: number;
	toolCallCount: number;
	durationMinutes: number;
	startTimestamp: string; // earliest ISO timestamp seen, for firstSessionDate
	// Token totals split so callers can pick the right scale per chart.
	modelUsage: Record<string, ModelTokenTotals>;
	toolCounts: Record<string, number>;
	languages: Record<string, number>;
}

interface ModelTokenTotals {
	input: number;
	output: number;
	cacheRead: number;
	cacheCreation: number;
}

interface RawLine {
	type?: string;
	timestamp?: string;
	message?: {
		id?: string;
		model?: string;
		content?: unknown;
		usage?: {
			input_tokens?: number;
			output_tokens?: number;
			cache_read_input_tokens?: number;
			cache_creation_input_tokens?: number;
		};
	};
}

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Update']);

const EXT_TO_LANGUAGE: Record<string, string> = {
	ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
	js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
	py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin',
	swift: 'Swift', c: 'C', h: 'C', cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++',
	cs: 'C#', php: 'PHP', svelte: 'Svelte', vue: 'Vue', html: 'HTML', css: 'CSS',
	scss: 'SCSS', sass: 'SCSS', less: 'Less', json: 'JSON', jsonc: 'JSON',
	yaml: 'YAML', yml: 'YAML', toml: 'TOML', xml: 'XML', sql: 'SQL',
	md: 'Markdown', markdown: 'Markdown', mdx: 'Markdown',
	sh: 'Shell', bash: 'Shell', zsh: 'Shell', fish: 'Shell',
	dart: 'Dart', scala: 'Scala', clj: 'Clojure', ex: 'Elixir', exs: 'Elixir',
	lua: 'Lua', r: 'R', pl: 'Perl', proto: 'Protobuf', graphql: 'GraphQL',
	gql: 'GraphQL', tf: 'Terraform', dockerfile: 'Dockerfile'
};

function languageForPath(filePath: string): string | null {
	const base = filePath.split('/').pop() ?? filePath;
	if (base.toLowerCase() === 'dockerfile') return 'Dockerfile';
	const dot = base.lastIndexOf('.');
	if (dot <= 0) return null;
	const ext = base.slice(dot + 1).toLowerCase();
	return EXT_TO_LANGUAGE[ext] ?? ext;
}

function isCommandText(text: string): boolean {
	const t = text.trim();
	return t.startsWith('<command-name>') || t.startsWith('<local-command');
}

/** True when a user line carries a real prompt (not a tool result or slash-command echo). */
function userLineHasPrompt(content: unknown): boolean {
	if (typeof content === 'string') {
		return content.trim() !== '' && !isCommandText(content);
	}
	if (Array.isArray(content)) {
		const text = content
			.filter((b): b is { type: string; text?: string } => !!b && typeof b === 'object')
			.filter((b) => b.type === 'text' && typeof b.text === 'string')
			.map((b) => b.text as string)
			.join(' ');
		return text.trim() !== '' && !isCommandText(text);
	}
	return false;
}

async function scanSessionFile(filePath: string, sessionId: string): Promise<SessionScan> {
	const scan: SessionScan = {
		sessionId,
		date: '',
		hour: null,
		messageCount: 0,
		toolCallCount: 0,
		durationMinutes: 0,
		startTimestamp: '',
		modelUsage: {},
		toolCounts: {},
		languages: {}
	};

	const seenAssistantIds = new Set<string>();
	const timestamps: number[] = [];
	let userCount = 0;
	let assistantCount = 0;
	let earliestMs = Infinity;

	const rl = createInterface({
		input: createReadStream(filePath, { encoding: 'utf-8' }),
		crlfDelay: Infinity
	});

	for await (const line of rl) {
		if (!line.trim()) continue;

		let parsed: RawLine;
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}

		if (parsed.timestamp) {
			const ms = new Date(parsed.timestamp).getTime();
			if (!isNaN(ms)) {
				timestamps.push(ms);
				if (ms < earliestMs) {
					earliestMs = ms;
					scan.startTimestamp = parsed.timestamp;
				}
			}
		}

		const msg = parsed.message;

		if (parsed.type === 'assistant') {
			if (!msg) continue;
			// Streamed chunks share one message.id — count and bill each id once.
			const id = msg.id;
			if (id) {
				if (seenAssistantIds.has(id)) continue;
				seenAssistantIds.add(id);
			}
			assistantCount++;

			// Skip synthetic/placeholder "models" like "<synthetic>" — these are
			// locally-generated error/system turns (API errors, interruptions) with
			// zero token usage, not real model inferences. Real model ids never start with "<".
			const model = msg.model;
			if (model && !model.startsWith('<')) {
				const totals = (scan.modelUsage[model] ??= {
					input: 0,
					output: 0,
					cacheRead: 0,
					cacheCreation: 0
				});
				const usage = msg.usage;
				if (usage) {
					totals.input += usage.input_tokens ?? 0;
					totals.output += usage.output_tokens ?? 0;
					totals.cacheRead += usage.cache_read_input_tokens ?? 0;
					totals.cacheCreation += usage.cache_creation_input_tokens ?? 0;
				}
			}

			if (Array.isArray(msg.content)) {
				for (const block of msg.content) {
					if (!block || typeof block !== 'object') continue;
					const b = block as { type?: string; name?: string; input?: Record<string, unknown> };
					if (b.type !== 'tool_use' || !b.name) continue;
					scan.toolCallCount++;
					scan.toolCounts[b.name] = (scan.toolCounts[b.name] || 0) + 1;
					if (EDIT_TOOLS.has(b.name)) {
						const p = b.input?.file_path ?? b.input?.notebook_path ?? b.input?.path;
						if (typeof p === 'string') {
							const lang = languageForPath(p);
							if (lang) scan.languages[lang] = (scan.languages[lang] || 0) + 1;
						}
					}
				}
			}
		} else if (parsed.type === 'user') {
			if (msg && userLineHasPrompt(msg.content)) userCount++;
		}
	}

	scan.messageCount = userCount + assistantCount;
	scan.durationMinutes = computeActiveDuration(timestamps);
	if (scan.startTimestamp) {
		scan.date = scan.startTimestamp.split('T')[0];
		scan.hour = new Date(scan.startTimestamp).getHours();
	}
	return scan;
}

/** Enumerate every top-level `<sessionId>.jsonl` transcript across all project dirs. */
function listSessionFiles(): { filePath: string; sessionId: string; project: string }[] {
	const out: { filePath: string; sessionId: string; project: string }[] = [];
	let dirs: string[];
	try {
		dirs = readdirSync(PROJECTS_DIR, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name);
	} catch {
		return out;
	}

	for (const dir of dirs) {
		const projectDir = join(PROJECTS_DIR, dir);
		const project = shortName(decodeDirName(dir)) || 'Unknown';
		let files: string[];
		try {
			files = readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));
		} catch {
			continue;
		}
		for (const f of files) {
			out.push({
				filePath: join(projectDir, f),
				sessionId: f.replace(/\.jsonl$/, ''),
				project
			});
		}
	}
	return out;
}

/**
 * Compute the full dashboard payload live from session transcripts. Each transcript
 * scan is memoised by path+mtime, so the first call reads every session and later
 * calls only re-scan files that changed.
 */
export async function computeClaudeStats(): Promise<ComputedDashboardData> {
	const sessionFiles = listSessionFiles();

	const dailyMap = new Map<string, { messageCount: number; sessionCount: number; toolCallCount: number }>();
	const dailyModelTokenMap = new Map<string, Map<string, number>>(); // date -> model -> input+output
	const modelUsage: Record<string, ModelUsage> = {};
	const hourCounts: Record<string, number> = {};
	const toolCounts: Record<string, number> = {};
	const languages: Record<string, number> = {};

	const projectDailyMap = new Map<string, Map<string, number>>(); // date -> project -> messages
	const projectDailyTokenMap = new Map<string, Map<string, { input: number; output: number }>>();
	const projectTokenMap = new Map<string, { input: number; output: number }>();
	const projectTotalMessages = new Map<string, number>();

	let totalSessions = 0;
	let totalMessages = 0;
	let totalTokens = 0;
	let firstSessionTs = '';
	const longestSession = { sessionId: '', duration: 0, messageCount: 0, timestamp: '' };

	const scans = await Promise.all(
		sessionFiles.map(async (sf) => {
			try {
				const scan = await getCachedAsync(sf.filePath, () => scanSessionFile(sf.filePath, sf.sessionId));
				return { sf, scan };
			} catch {
				return null;
			}
		})
	);

	for (const entry of scans) {
		if (!entry) continue;
		const { sf, scan } = entry;
		if (!scan.date) continue; // skip empty/corrupt transcripts with no timestamps

		totalSessions++;
		totalMessages += scan.messageCount;

		if (firstSessionTs === '' || scan.startTimestamp < firstSessionTs) {
			firstSessionTs = scan.startTimestamp;
		}
		if (scan.durationMinutes > longestSession.duration) {
			longestSession.sessionId = scan.sessionId;
			longestSession.duration = scan.durationMinutes;
			longestSession.messageCount = scan.messageCount;
			longestSession.timestamp = scan.startTimestamp;
		}

		const date = scan.date;
		const daily = dailyMap.get(date) || { messageCount: 0, sessionCount: 0, toolCallCount: 0 };
		daily.messageCount += scan.messageCount;
		daily.sessionCount++;
		daily.toolCallCount += scan.toolCallCount;
		dailyMap.set(date, daily);

		if (scan.hour !== null) {
			const h = String(scan.hour);
			hourCounts[h] = (hourCounts[h] || 0) + 1;
		}

		for (const [tool, count] of Object.entries(scan.toolCounts)) {
			toolCounts[tool] = (toolCounts[tool] || 0) + count;
		}
		for (const [lang, count] of Object.entries(scan.languages)) {
			languages[lang] = (languages[lang] || 0) + count;
		}

		// Token aggregation by model.
		let sessionInputWithCache = 0;
		let sessionOutput = 0;
		for (const [model, t] of Object.entries(scan.modelUsage)) {
			const mu = (modelUsage[model] ??= {
				inputTokens: 0,
				outputTokens: 0,
				cacheReadInputTokens: 0,
				cacheCreationInputTokens: 0,
				webSearchRequests: 0,
				costUSD: 0
			});
			mu.inputTokens += t.input;
			mu.outputTokens += t.output;
			mu.cacheReadInputTokens += t.cacheRead;
			mu.cacheCreationInputTokens += t.cacheCreation;

			totalTokens += t.input + t.output + t.cacheRead + t.cacheCreation;

			// "Tokens by model" chart uses raw input+output (cache excluded), matching
			// the scale the CLI's stats-cache used.
			if (!dailyModelTokenMap.has(date)) dailyModelTokenMap.set(date, new Map());
			const dayModel = dailyModelTokenMap.get(date)!;
			dayModel.set(model, (dayModel.get(model) || 0) + t.input + t.output);

			// Per-project token charts historically counted cache tokens as input.
			sessionInputWithCache += t.input + t.cacheRead + t.cacheCreation;
			sessionOutput += t.output;
		}

		// Per-project aggregation.
		const project = sf.project;
		if (!projectDailyMap.has(date)) projectDailyMap.set(date, new Map());
		const dayMsg = projectDailyMap.get(date)!;
		dayMsg.set(project, (dayMsg.get(project) || 0) + scan.messageCount);

		if (!projectDailyTokenMap.has(date)) projectDailyTokenMap.set(date, new Map());
		const dayTok = projectDailyTokenMap.get(date)!;
		const dt = dayTok.get(project) || { input: 0, output: 0 };
		dt.input += sessionInputWithCache;
		dt.output += sessionOutput;
		dayTok.set(project, dt);

		const pt = projectTokenMap.get(project) || { input: 0, output: 0 };
		pt.input += sessionInputWithCache;
		pt.output += sessionOutput;
		projectTokenMap.set(project, pt);

		projectTotalMessages.set(project, (projectTotalMessages.get(project) || 0) + scan.messageCount);
	}

	// Top 8 projects by total messages; the rest collapse into "Other".
	const topProjects = new Set(
		Array.from(projectTotalMessages.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([p]) => p)
	);
	const resolveProject = (p: string) => (topProjects.has(p) ? p : 'Other');

	const dailyProjectActivity: DailyProjectActivity[] = Array.from(projectDailyMap.entries())
		.map(([date, dayMap]) => {
			const byProject: Record<string, number> = {};
			for (const [project, count] of dayMap) {
				const r = resolveProject(project);
				byProject[r] = (byProject[r] || 0) + count;
			}
			return { date, byProject };
		})
		.sort((a, b) => a.date.localeCompare(b.date));

	const dailyProjectTokens: DailyProjectTokens[] = Array.from(projectDailyTokenMap.entries())
		.map(([date, dayMap]) => {
			const byProject: Record<string, { input: number; output: number }> = {};
			for (const [project, tokens] of dayMap) {
				const r = resolveProject(project);
				if (!byProject[r]) byProject[r] = { input: 0, output: 0 };
				byProject[r].input += tokens.input;
				byProject[r].output += tokens.output;
			}
			return { date, byProject };
		})
		.sort((a, b) => a.date.localeCompare(b.date));

	const collapsedTokens = new Map<string, { input: number; output: number }>();
	for (const [project, tokens] of projectTokenMap) {
		const r = resolveProject(project);
		const existing = collapsedTokens.get(r) || { input: 0, output: 0 };
		existing.input += tokens.input;
		existing.output += tokens.output;
		collapsedTokens.set(r, existing);
	}
	const projectTokenUsage: ProjectTokenUsage[] = Array.from(collapsedTokens.entries())
		.map(([project, tokens]) => ({
			project,
			totalTokens: tokens.input + tokens.output,
			inputTokens: tokens.input,
			outputTokens: tokens.output
		}))
		.sort((a, b) => b.totalTokens - a.totalTokens);

	const dailyActivity = Array.from(dailyMap.entries())
		.map(([date, d]) => ({ date, ...d }))
		.sort((a, b) => a.date.localeCompare(b.date));

	const dailyModelTokens = Array.from(dailyModelTokenMap.entries())
		.map(([date, modelMap]) => ({ date, tokensByModel: Object.fromEntries(modelMap) }))
		.sort((a, b) => a.date.localeCompare(b.date));

	const lastComputedDate = dailyActivity.length
		? dailyActivity[dailyActivity.length - 1].date
		: '';

	const stats: StatsCache = {
		version: 1,
		lastComputedDate,
		dailyActivity,
		dailyModelTokens,
		modelUsage,
		totalSessions,
		totalMessages,
		longestSession,
		firstSessionDate: firstSessionTs || new Date().toISOString(),
		hourCounts
	};

	return {
		stats,
		toolCounts,
		languages,
		totalTokens,
		activeDays: dailyMap.size,
		dailyProjectActivity,
		dailyProjectTokens,
		projectTokenUsage
	};
}
