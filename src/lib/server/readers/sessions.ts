import { join } from 'path';
import { PROJECTS_DIR } from '../config.js';
import { streamSessionMessages } from '../parsers/jsonl.js';
import { getSessionMeta } from './session-meta.js';
import { getSessionFacets } from './session-facets.js';
import type { ConversationMessage, SessionMeta, SessionFacets } from '../types.js';

export interface SessionDetail {
	sessionId: string;
	projectDir: string;
	messages: ConversationMessage[];
	totalCount: number;
	meta: SessionMeta | undefined;
	facets: SessionFacets | undefined;
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

	return { sessionId, projectDir, messages, totalCount, meta, facets };
}

export async function loadSessionMessages(
	projectDir: string,
	sessionId: string,
	offset: number,
	limit: number
): Promise<{ messages: ConversationMessage[]; totalCount: number }> {
	const filePath = join(PROJECTS_DIR, projectDir, `${sessionId}.jsonl`);
	return streamSessionMessages(filePath, { offset, limit });
}
