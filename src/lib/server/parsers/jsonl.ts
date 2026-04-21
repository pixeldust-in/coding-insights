import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';
import type { ConversationMessage, ContentBlock } from '../types.js';

interface RawJsonlLine {
	type: string;
	uuid?: string;
	timestamp?: string;
	message?: {
		id?: string;
		role?: string;
		model?: string;
		content?: string | ContentBlock[];
		stop_reason?: string | null;
		usage?: {
			input_tokens?: number;
			output_tokens?: number;
			cache_read_input_tokens?: number;
			cache_creation_input_tokens?: number;
		};
	};
	[key: string]: unknown;
}

/**
 * Stream a JSONL session file and return deduplicated conversation messages.
 * Assistant chunks with the same message.id are deduplicated — only the last one is kept.
 */
export async function streamSessionMessages(
	filePath: string,
	options: { offset?: number; limit?: number } = {}
): Promise<{ messages: ConversationMessage[]; totalCount: number }> {
	const { offset = 0, limit = 50 } = options;

	// Claude Code archives old session transcripts: only a sessions-index.json
	// entry remains, no .jsonl file on disk. Return empty so callers can still
	// show the index-level metadata instead of 500-ing.
	if (!existsSync(filePath)) {
		return { messages: [], totalCount: 0 };
	}

	// Phase 1: Stream through the file, collecting messages and deduplicating
	const messagesById = new Map<string, ConversationMessage>();
	const orderedIds: string[] = [];

	const rl = createInterface({
		input: createReadStream(filePath, { encoding: 'utf-8' }),
		crlfDelay: Infinity
	});

	for await (const line of rl) {
		if (!line.trim()) continue;

		let parsed: RawJsonlLine;
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}

		if (parsed.type !== 'user' && parsed.type !== 'assistant') continue;
		if (!parsed.message) continue;

		const role = parsed.type as 'user' | 'assistant';

		if (role === 'assistant') {
			const msgId = parsed.message.id;
			if (!msgId) continue;

			const msg: ConversationMessage = {
				id: msgId,
				role: 'assistant',
				content: parsed.message.content ?? '',
				timestamp: parsed.timestamp ?? '',
				model: parsed.message.model,
				tokens: {
					input: parsed.message.usage?.input_tokens,
					output: parsed.message.usage?.output_tokens
				}
			};

			if (!messagesById.has(msgId)) {
				orderedIds.push(msgId);
			}
			messagesById.set(msgId, msg);
		} else {
			// Skip tool_result messages (automatic responses to tool calls)
			const content = parsed.message.content;
			if (Array.isArray(content)) {
				const hasVisibleContent = content.some(
					(b) => b.type === 'text' && typeof b.text === 'string' && b.text.trim() !== ''
				);
				if (!hasVisibleContent) continue;
			} else if (typeof content === 'string' && !content.trim()) {
				continue;
			}

			const id = parsed.uuid ?? `user-${Date.now()}-${Math.random()}`;
			const msg: ConversationMessage = {
				id,
				role: 'user',
				content: content ?? '',
				timestamp: parsed.timestamp ?? ''
			};
			if (!messagesById.has(id)) {
				orderedIds.push(id);
			}
			messagesById.set(id, msg);
		}
	}

	const totalCount = orderedIds.length;
	const paginatedIds = orderedIds.slice(offset, offset + limit);
	const messages = paginatedIds.map((id) => messagesById.get(id)!).filter(Boolean);

	return { messages, totalCount };
}

/**
 * Quick scan: count messages in a JSONL file without fully parsing content.
 */
export async function countSessionMessages(filePath: string): Promise<number> {
	const seen = new Set<string>();
	let userCount = 0;

	const rl = createInterface({
		input: createReadStream(filePath, { encoding: 'utf-8' }),
		crlfDelay: Infinity
	});

	for await (const line of rl) {
		if (!line.trim()) continue;
		try {
			// Minimal parse - just extract type and message.id
			const typeMatch = line.match(/"type"\s*:\s*"(user|assistant)"/);
			if (!typeMatch) continue;

			if (typeMatch[1] === 'user') {
				userCount++;
			} else {
				const idMatch = line.match(/"id"\s*:\s*"(msg_[^"]+)"/);
				if (idMatch) seen.add(idMatch[1]);
			}
		} catch {
			continue;
		}
	}

	return userCount + seen.size;
}
