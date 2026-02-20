import { join } from 'path';
import { PROJECTS_DIR } from '../config.js';
import { streamSessionMessages } from '../parsers/jsonl.js';
import { getSessionMeta } from './session-meta.js';
import { getSessionFacets } from './session-facets.js';
import { renderMarkdown } from '../markdown.js';
import type { ConversationMessage, SessionMeta, SessionFacets, TextBlock } from '../types.js';

export interface SessionDetail {
	sessionId: string;
	projectDir: string;
	messages: ConversationMessage[];
	totalCount: number;
	meta: SessionMeta | undefined;
	facets: SessionFacets | undefined;
	firstPrompt: string;
}

export async function loadSession(
	projectDir: string,
	sessionId: string,
	offset = 0,
	limit = 50
): Promise<SessionDetail> {
	const filePath = join(PROJECTS_DIR, projectDir, `${sessionId}.jsonl`);
	const { messages, totalCount } = await streamSessionMessages(filePath, { offset, limit });
	const meta = getSessionMeta(sessionId);
	const facets = getSessionFacets(sessionId);

	// Extract first prompt from messages when meta is unavailable
	let firstPrompt = meta?.first_prompt || '';
	if (!firstPrompt) {
		for (const msg of messages) {
			if (msg.role !== 'user') continue;
			const text = typeof msg.content === 'string'
				? msg.content
				: msg.content
					.filter((b): b is { type: 'text'; text: string } => b.type === 'text')
					.map((b) => b.text)
					.join(' ');
			if (text.trim()) {
				firstPrompt = text.trim().slice(0, 200);
				break;
			}
		}
	}

	await renderMessagesMarkdown(messages);

	return { sessionId, projectDir, messages, totalCount, meta, facets, firstPrompt };
}

export async function loadSessionMessages(
	projectDir: string,
	sessionId: string,
	offset: number,
	limit: number
): Promise<{ messages: ConversationMessage[]; totalCount: number }> {
	const filePath = join(PROJECTS_DIR, projectDir, `${sessionId}.jsonl`);
	const result = await streamSessionMessages(filePath, { offset, limit });
	await renderMessagesMarkdown(result.messages);
	return result;
}

async function renderMessagesMarkdown(messages: ConversationMessage[]): Promise<void> {
	for (const msg of messages) {
		if (msg.role !== 'assistant' || typeof msg.content === 'string') continue;
		for (const block of msg.content) {
			if (block.type === 'text' && block.text) {
				(block as TextBlock).renderedHtml = await renderMarkdown(block.text);
			}
		}
	}
}
