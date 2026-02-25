import type { DailyProjectActivity, DailyProjectTokens, ProjectTokenUsage } from '../types.js';

export interface CodexSessionMeta {
	id: string;
	timestamp: string;
	cwd: string;
	cli_version: string;
	model_provider: string;
	source?: string;
	git?: {
		commit_hash?: string;
		branch?: string;
		repository_url?: string;
	};
}

export interface CodexSessionListItem {
	sessionId: string;
	filePath: string;
	timestamp: string;
	cwd: string;
	projectName: string;
	firstPrompt: string;
	model: string;
	messageCount: number;
}

export interface CodexHistoryEntry {
	session_id: string;
	ts: number;
	text: string;
}

export interface CodexConfig {
	model?: string;
	model_reasoning_effort?: string;
	personality?: string;
	projects?: Record<string, { trust_level: string }>;
	mcp_servers?: Record<string, { command: string; args?: string[] }>;
	notice?: Record<string, unknown>;
}

export interface CodexPlan {
	id: string;
	title: string;
	content: string;
	preview: string;
	sessionId: string;
	timestamp: string;
	projectName: string;
}

export interface CodexDashboardStats {
	totalSessions: number;
	totalMessages: number;
	totalTokens: number;
	activeDays: number;
	dailyActivity: { date: string; sessionCount: number; messageCount: number }[];
	dailyModelTokens: { date: string; tokensByModel: Record<string, number> }[];
	hourCounts: Record<string, number>;
	functionCallCounts: Record<string, number>;
	languages: Record<string, number>;
	modelTokens: Record<string, { input: number; output: number; reasoning: number }>;
	firstSessionDate: string;
	dailyProjectActivity: DailyProjectActivity[];
	dailyProjectTokens: DailyProjectTokens[];
	projectTokenUsage: ProjectTokenUsage[];
}
