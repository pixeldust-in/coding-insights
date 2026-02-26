import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import type { ConversationMessage, ContentBlock, TextBlock, ThinkingBlock, ToolUseBlock, ToolResultBlock } from '../../types.js';
import type { CodexSessionListItem, CodexSessionMeta } from '../types.js';
import { extToLanguage } from '$utils/languages.js';

interface CodexLine {
	timestamp: string;
	type: string;
	payload: Record<string, unknown>;
}

/**
 * Stream a Codex session JSONL file and return conversation messages.
 * Maps Codex-specific formats to the shared ConversationMessage type.
 */
export async function streamCodexSessionMessages(
	filePath: string,
	options: { offset?: number; limit?: number } = {}
): Promise<{ messages: ConversationMessage[]; totalCount: number }> {
	const { offset = 0, limit = 50 } = options;

	const messages: ConversationMessage[] = [];
	let currentAssistant: ConversationMessage | null = null;
	let msgCounter = 0;

	const rl = createInterface({
		input: createReadStream(filePath, { encoding: 'utf-8' }),
		crlfDelay: Infinity
	});

	for await (const line of rl) {
		if (!line.trim()) continue;

		let parsed: CodexLine;
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}

		if (parsed.type !== 'response_item') continue;
		const payload = parsed.payload;
		const payloadType = payload.type as string;
		const role = payload.role as string | undefined;

		// User message
		if (payloadType === 'message' && role === 'user') {
			const content = payload.content as Array<{ type: string; text?: string }> | undefined;
			if (!content) continue;

			// Skip developer/system messages
			const textParts = content
				.filter((c) => c.type === 'input_text' && c.text)
				.map((c) => c.text!);

			// Filter out environment context and system instruction messages
			const userText = textParts.find(
				(t) => !t.startsWith('<environment_context>') &&
					!t.startsWith('# AGENTS.md') &&
					!t.startsWith('<INSTRUCTIONS>')
			);
			if (!userText) continue;

			// Flush any pending assistant message
			if (currentAssistant) {
				messages.push(currentAssistant);
				currentAssistant = null;
			}

			msgCounter++;
			messages.push({
				id: `user-${msgCounter}`,
				role: 'user',
				content: userText,
				timestamp: parsed.timestamp
			});
			continue;
		}

		// Assistant message (output_text)
		if (payloadType === 'message' && role === 'assistant') {
			const content = payload.content as Array<{ type: string; text?: string }> | undefined;
			if (!content) continue;

			const text = content
				.filter((c) => c.type === 'output_text' && c.text)
				.map((c) => c.text!)
				.join('\n');

			if (!text) continue;

			// Flush any pending assistant message
			if (currentAssistant) {
				messages.push(currentAssistant);
			}

			msgCounter++;
			const blocks: ContentBlock[] = [{ type: 'text', text } as TextBlock];
			currentAssistant = {
				id: `assistant-${msgCounter}`,
				role: 'assistant',
				content: blocks,
				timestamp: parsed.timestamp
			};
			continue;
		}

		// Reasoning
		if (payloadType === 'reasoning') {
			const summary = payload.summary as Array<{ type: string; text?: string }> | undefined;
			const summaryText = summary
				?.filter((s) => s.type === 'summary_text' && s.text)
				.map((s) => s.text!)
				.join('\n');

			if (summaryText) {
				if (!currentAssistant) {
					msgCounter++;
					currentAssistant = {
						id: `assistant-${msgCounter}`,
						role: 'assistant',
						content: [],
						timestamp: parsed.timestamp
					};
				}
				const blocks = (currentAssistant.content as ContentBlock[]) || [];
				blocks.push({ type: 'thinking', thinking: summaryText } as ThinkingBlock);
				currentAssistant.content = blocks;
			}
			continue;
		}

		// Function call (tool use)
		if (payloadType === 'function_call' || payloadType === 'custom_tool_call') {
			const name = (payload.name as string) || 'unknown';
			let input: Record<string, unknown> = {};
			try {
				const args = payload.arguments as string;
				if (args) input = JSON.parse(args);
			} catch {
				input = { raw: payload.arguments };
			}

			// apply_patch stores patch content in payload.input, not arguments
			if (name === 'apply_patch' && typeof payload.input === 'string') {
				input = { patch: payload.input };
			}

			if (!currentAssistant) {
				msgCounter++;
				currentAssistant = {
					id: `assistant-${msgCounter}`,
					role: 'assistant',
					content: [],
					timestamp: parsed.timestamp
				};
			}
			const blocks = (currentAssistant.content as ContentBlock[]) || [];
			blocks.push({
				type: 'tool_use',
				id: (payload.call_id as string) || `call-${msgCounter}`,
				name,
				input
			} as ToolUseBlock);
			currentAssistant.content = blocks;
			continue;
		}

		// Function call output (tool result)
		if (payloadType === 'function_call_output') {
			if (!currentAssistant) {
				msgCounter++;
				currentAssistant = {
					id: `assistant-${msgCounter}`,
					role: 'assistant',
					content: [],
					timestamp: parsed.timestamp
				};
			}
			const blocks = (currentAssistant.content as ContentBlock[]) || [];
			let outputText = '';
			try {
				const outputObj = JSON.parse(payload.output as string);
				outputText = outputObj.output || JSON.stringify(outputObj, null, 2);
			} catch {
				outputText = (payload.output as string) || '';
			}
			blocks.push({
				type: 'tool_result',
				tool_use_id: (payload.call_id as string) || '',
				content: outputText.slice(0, 2000) // Truncate long outputs
			} as ToolResultBlock);
			currentAssistant.content = blocks;
			continue;
		}
	}

	// Flush final assistant message
	if (currentAssistant) {
		messages.push(currentAssistant);
	}

	const totalCount = messages.length;
	const paginated = messages.slice(offset, offset + limit);
	return { messages: paginated, totalCount };
}

/**
 * Quick scan a Codex session file to extract metadata without full parsing.
 */
export async function scanCodexSessionMeta(filePath: string): Promise<CodexSessionListItem | null> {
	const rl = createInterface({
		input: createReadStream(filePath, { encoding: 'utf-8' }),
		crlfDelay: Infinity
	});

	let meta: CodexSessionMeta | null = null;
	let firstPrompt = '';
	let model = '';
	let messageCount = 0;
	let linesRead = 0;

	for await (const line of rl) {
		if (!line.trim()) continue;
		linesRead++;

		let parsed: CodexLine;
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}

		// Session meta (always first line)
		if (parsed.type === 'session_meta' && !meta) {
			const p = parsed.payload as unknown as CodexSessionMeta;
			meta = p;
		}

		// First user prompt — prefer event_msg user_message (actual human input)
		if (parsed.type === 'event_msg' && !firstPrompt) {
			const payload = parsed.payload;
			if (payload.type === 'user_message' && payload.message) {
				const msg = payload.message as string;
				if (msg.trim()) firstPrompt = msg.slice(0, 200);
			}
		}

		// Fallback: extract from response_item user messages for older sessions
		if (parsed.type === 'response_item' && !firstPrompt) {
			const payload = parsed.payload;
			if (payload.type === 'message' && payload.role === 'user') {
				const content = payload.content as Array<{ type: string; text?: string }> | undefined;
				if (content) {
					const text = content
						.filter((c: { type: string; text?: string }) => c.type === 'input_text' && c.text)
						.map((c: { type: string; text?: string }) => c.text!)
						.find((t: string) =>
							!t.startsWith('<environment_context>') &&
							!t.startsWith('# AGENTS.md') &&
							!t.startsWith('<INSTRUCTIONS>')
						);
					if (text) {
						// Strip "## My request for Codex:" prefix
						const cleaned = text.replace(/^##\s*My request for Codex:\s*/i, '').trim();
						if (cleaned) firstPrompt = cleaned.slice(0, 200);
					}
				}
			}
		}

		// Model from turn_context
		if (parsed.type === 'turn_context' && !model) {
			model = (parsed.payload.model as string) || '';
		}

		// Count response_item messages for approximate message count
		if (parsed.type === 'response_item') {
			const payload = parsed.payload;
			if (
				(payload.type === 'message' && payload.role === 'user') ||
				(payload.type === 'message' && payload.role === 'assistant')
			) {
				messageCount++;
			}
		}

		// After scanning enough lines for meta, break early if we have what we need
		if (linesRead > 30 && meta && firstPrompt && model) break;
	}

	// If we broke early, do a quick full count
	if (linesRead <= 20 || !meta) {
		// Continue reading for full message count if we broke early
	}

	if (!meta) return null;

	const sessionId = meta.id;
	const projectName = meta.cwd.split('/').filter(Boolean).pop() || meta.cwd;

	return {
		sessionId,
		filePath,
		timestamp: meta.timestamp,
		cwd: meta.cwd,
		projectName,
		firstPrompt,
		model,
		messageCount
	};
}

function extractLanguagesFromPatch(input: string): string[] {
	const langs: string[] = [];
	const matches = input.matchAll(/\*\*\* (?:Update|Add|Delete) File:\s*(\S+)/g);
	for (const m of matches) {
		const ext = m[1].match(/(\.[a-zA-Z0-9]+)$/);
		if (ext) {
			const lang = extToLanguage[ext[1].toLowerCase()];
			if (lang) langs.push(lang);
		}
	}
	return langs;
}

/**
 * Full scan to get accurate message count and token totals.
 */
export async function fullScanCodexSession(filePath: string): Promise<{
	messageCount: number;
	totalInputTokens: number;
	totalOutputTokens: number;
	totalReasoningTokens: number;
	functionCallCounts: Record<string, number>;
	languages: Record<string, number>;
	hourOfDay: number | null;
}> {
	const rl = createInterface({
		input: createReadStream(filePath, { encoding: 'utf-8' }),
		crlfDelay: Infinity
	});

	let messageCount = 0;
	let totalInputTokens = 0;
	let totalOutputTokens = 0;
	let totalReasoningTokens = 0;
	const functionCallCounts: Record<string, number> = {};
	const languages: Record<string, number> = {};
	let hourOfDay: number | null = null;

	for await (const line of rl) {
		if (!line.trim()) continue;

		let parsed: CodexLine;
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}

		// Get hour from first timestamp
		if (hourOfDay === null && parsed.timestamp) {
			try {
				hourOfDay = new Date(parsed.timestamp).getHours();
			} catch { /* ignore */ }
		}

		if (parsed.type === 'response_item') {
			const payload = parsed.payload;
			if (
				(payload.type === 'message' && payload.role === 'user') ||
				(payload.type === 'message' && payload.role === 'assistant')
			) {
				messageCount++;
			}
			if (payload.type === 'function_call' || payload.type === 'custom_tool_call') {
				const name = (payload.name as string) || 'unknown';
				functionCallCounts[name] = (functionCallCounts[name] || 0) + 1;

				// Language detection from apply_patch (file paths in patch content)
				if (name === 'apply_patch') {
					const input = payload.input as string;
					if (input) {
						for (const lang of extractLanguagesFromPatch(input)) {
							languages[lang] = (languages[lang] || 0) + 1;
						}
					}
				}
			}
		}

		// Token counts from event_msg
		if (parsed.type === 'event_msg') {
			const payload = parsed.payload;
			if (payload.type === 'token_count') {
				const info = payload.info as {
					last_token_usage?: {
						input_tokens?: number;
						output_tokens?: number;
						reasoning_output_tokens?: number;
					};
				} | null;
				if (info?.last_token_usage) {
					totalInputTokens += info.last_token_usage.input_tokens || 0;
					totalOutputTokens += info.last_token_usage.output_tokens || 0;
					totalReasoningTokens += info.last_token_usage.reasoning_output_tokens || 0;
				}
			}
		}
	}

	return { messageCount, totalInputTokens, totalOutputTokens, totalReasoningTokens, functionCallCounts, languages, hourOfDay };
}
