// Project-level analytics
export interface DailyProjectActivity {
	date: string;
	byProject: Record<string, number>; // projectDisplayName -> messageCount
}

export interface ProjectTokenUsage {
	project: string;
	totalTokens: number;
	inputTokens: number;
	outputTokens: number;
}

export interface DailyProjectTokens {
	date: string;
	byProject: Record<string, { input: number; output: number }>;
}

// Stats Cache
export interface DailyActivity {
	date: string;
	messageCount: number;
	sessionCount: number;
	toolCallCount: number;
}

export interface DailyModelTokens {
	date: string;
	tokensByModel: Record<string, number>;
}

export interface ModelUsage {
	inputTokens: number;
	outputTokens: number;
	cacheReadInputTokens: number;
	cacheCreationInputTokens: number;
	webSearchRequests: number;
	costUSD: number;
}

export interface LongestSession {
	sessionId: string;
	duration: number;
	messageCount: number;
	timestamp: string;
}

export interface StatsCache {
	version: number;
	lastComputedDate: string;
	dailyActivity: DailyActivity[];
	dailyModelTokens: DailyModelTokens[];
	modelUsage: Record<string, ModelUsage>;
	totalSessions: number;
	totalMessages: number;
	longestSession: LongestSession;
	firstSessionDate: string;
	hourCounts: Record<string, number>;
}

// Session Meta
export interface SessionMeta {
	session_id: string;
	project_path: string;
	start_time: string;
	duration_minutes: number;
	user_message_count: number;
	assistant_message_count: number;
	tool_counts: Record<string, number>;
	languages: Record<string, number>;
	git_commits: number;
	git_pushes: number;
	input_tokens: number;
	output_tokens: number;
	first_prompt: string;
	summary: string;
	lines_added: number;
	lines_removed: number;
	files_modified: number;
	uses_task_agent: boolean;
	uses_mcp: boolean;
	uses_web_search: boolean;
	uses_web_fetch: boolean;
	user_message_timestamps: string[];
}

// Session Facets
export interface SessionFacets {
	session_id: string;
	underlying_goal: string;
	goal_categories: Record<string, number>;
	outcome: string;
	user_satisfaction_counts: Record<string, number>;
	claude_helpfulness: string;
	session_type: string;
	friction_counts: Record<string, number>;
	primary_success: string;
	brief_summary: string;
}

// Sessions Index
export interface SessionIndexEntry {
	sessionId: string;
	fullPath: string;
	fileMtime: number;
	firstPrompt: string;
	summary: string;
	messageCount: number;
	created: string;
	modified: string;
	gitBranch: string;
	projectPath: string;
	isSidechain: boolean;
}

export interface SessionsIndex {
	version: number;
	entries: SessionIndexEntry[];
}

// Project
export interface Project {
	dirName: string;
	decodedPath: string;
	sessionCount: number;
	lastActive: string;
}

// Session list item (combined from multiple sources)
export interface SessionListItem {
	sessionId: string;
	firstPrompt: string;
	summary: string;
	messageCount: number;
	created: string;
	modified: string;
	gitBranch: string;
	model?: string;
	durationMinutes?: number;
	toolCounts?: Record<string, number>;
	languages?: Record<string, number>;
	inputTokens?: number;
	outputTokens?: number;
	linesAdded?: number;
	linesRemoved?: number;
	outcome?: string;
	projectName?: string;
	projectDir?: string;
}

// JSONL Message types
export interface JasonlUserMessage {
	type: 'user';
	uuid: string;
	parentUuid: string | null;
	sessionId: string;
	timestamp: string;
	gitBranch?: string;
	message: {
		role: 'user';
		content: string | ContentBlock[];
	};
}

export interface JasonlAssistantMessage {
	type: 'assistant';
	uuid: string;
	parentUuid: string | null;
	sessionId: string;
	timestamp: string;
	message: {
		id: string;
		model: string;
		role: 'assistant';
		content: ContentBlock[];
		stop_reason: string | null;
		usage?: {
			input_tokens?: number;
			output_tokens?: number;
			cache_read_input_tokens?: number;
			cache_creation_input_tokens?: number;
		};
	};
}

export type ContentBlock =
	| TextBlock
	| ThinkingBlock
	| ToolUseBlock
	| ToolResultBlock
	| ImageBlock;

export interface TextBlock {
	type: 'text';
	text: string;
	renderedHtml?: string;
}

export interface ThinkingBlock {
	type: 'thinking';
	thinking: string;
}

export interface ToolUseBlock {
	type: 'tool_use';
	id: string;
	name: string;
	input: Record<string, unknown>;
}

export interface ToolResultBlock {
	type: 'tool_result';
	tool_use_id: string;
	content: string | ContentBlock[];
}

export interface ImageBlock {
	type: 'image';
	source: {
		type: 'base64';
		media_type: string;
		data: string;
	};
}

export type ConversationMessage = {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string | ContentBlock[];
	timestamp: string;
	model?: string;
	tokens?: {
		input?: number;
		output?: number;
	};
};

// Commands
export interface Command {
	name: string;
	description: string;
	allowedTools: string;
	content: string;
	renderedHtml?: string;
}

// Skills
export interface Skill {
	name: string;
	dirName: string;
	description: string;
	content: string;
	renderedHtml?: string;
	subDocs: { name: string; content: string; renderedHtml?: string }[];
}

// Settings
export interface Settings {
	permissions: {
		ask?: string[];
		allow?: string[];
		deny?: string[];
	};
	statusLine?: unknown;
	alwaysThinkingEnabled?: boolean;
	skipDangerousModePermissionPrompt?: boolean;
	enabledPlugins?: Record<string, boolean>;
}

export interface Plugin {
	name: string;
	scope: string;
	version: string;
	installedAt: string;
	lastUpdated: string;
}

// CLI Help
export interface CliFlag {
	short?: string;
	long: string;
	argument?: string;
	description: string;
}

export interface CliSubcommand {
	name: string;
	summary: string;
}

export interface CliSlashCommand {
	name: string;
	description: string;
	argument?: string;
}

export interface CliHelpData {
	tool: 'claude' | 'codex';
	usage: string;
	description: string;
	options: CliFlag[];
	subcommands: CliSubcommand[];
	slashCommands: CliSlashCommand[];
	error?: string;
}

// History
export interface HistoryEntry {
	display: string;
	timestamp: number;
	project: string;
	sessionId: string;
	pastedContents?: Record<string, unknown>;
}
