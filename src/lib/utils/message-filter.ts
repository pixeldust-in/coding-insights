import type { ConversationMessage } from '$lib/server/types.js';

/** With tool calls hidden, a message consisting only of tool calls has nothing to show. */
export function hasNonToolContent(msg: ConversationMessage): boolean {
	if (typeof msg.content === 'string') return msg.content.trim() !== '';
	return msg.content.some(
		(b) =>
			b.type === 'thinking' ||
			b.type === 'image' ||
			(b.type === 'text' && !!b.text?.trim())
	);
}
