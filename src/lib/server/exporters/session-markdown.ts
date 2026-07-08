import { format } from 'date-fns';
import { formatToolInput } from '../../utils/tool-format.js';
import type { ConversationMessage, ContentBlock, SessionMeta } from '../types.js';

export interface SessionMarkdownInput {
	sessionId: string;
	projectName: string;
	messages: ConversationMessage[];
	meta?: SessionMeta;
}

function formatTimestamp(ts: string): string {
	if (!ts) return '';
	const d = new Date(ts);
	if (isNaN(d.getTime())) return '';
	return format(d, 'yyyy-MM-dd HH:mm');
}

/** Wrap content in a code fence longer than any backtick run inside it. */
function fenced(content: string, lang = ''): string {
	const longest = (content.match(/`+/g) ?? []).reduce((m, r) => Math.max(m, r.length), 2);
	const fence = '`'.repeat(longest + 1);
	return `${fence}${lang}\n${content}\n${fence}`;
}

function blockquote(text: string): string {
	return text
		.split('\n')
		.map((line) => (line ? `> ${line}` : '>'))
		.join('\n');
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripAnsi(text: string): string {
	return text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\[[\d;]*m/g, '');
}

function cleanUserText(text: string): string {
	return text
		.replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, '')
		.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
		.trim();
}

/** Mirror UserMessage.svelte's handling of slash-command wrapper messages. */
function userTextToMarkdown(raw: string): string {
	const trimmed = raw.trim();

	if (/^<local-command-caveat>[\s\S]*<\/local-command-caveat>$/.test(trimmed)) return '';

	const cmdMatch = trimmed.match(
		/<command-name>(\/[^<]+)<\/command-name>\s*<command-message>([^<]*)<\/command-message>\s*<command-args>([^<]*)<\/command-args>/s
	);
	if (cmdMatch) {
		const args = cmdMatch[3].trim();
		return `> \`${cmdMatch[1].trim()}${args ? ` ${args}` : ''}\``;
	}

	const stdoutMatch = trimmed.match(/^<local-command-stdout>([\s\S]*?)(<\/local-command-stdout>)?$/);
	if (stdoutMatch) {
		const cleaned = stripAnsi(stdoutMatch[1]).trim();
		return cleaned ? fenced(cleaned) : '';
	}

	return cleanUserText(raw);
}

function getBlocks(content: string | ContentBlock[]): ContentBlock[] {
	if (typeof content === 'string') return [{ type: 'text', text: content }];
	return content;
}

function userMessageToMarkdown(msg: ConversationMessage): string {
	const parts: string[] = [];
	for (const block of getBlocks(msg.content)) {
		if (block.type === 'text' && block.text) {
			const md = userTextToMarkdown(block.text);
			if (md) parts.push(md);
		} else if (block.type === 'image') {
			parts.push(`*[image: ${block.source.media_type}]*`);
		}
	}
	return parts.join('\n\n');
}

function assistantBlockToMarkdown(block: ContentBlock): string {
	switch (block.type) {
		case 'text':
			return block.text?.trim() ?? '';
		case 'thinking': {
			const t = block.thinking?.trim();
			if (!t) return '';
			return `<details>\n<summary>🧠 Thinking</summary>\n\n${blockquote(t)}\n\n</details>`;
		}
		case 'tool_use': {
			const summary = escapeHtml(
				formatToolInput(block.name, block.input).replace(/\s+/g, ' ').slice(0, 120)
			);
			const inputJson = JSON.stringify(block.input, null, 2);
			return `<details>\n<summary>🔧 <b>${escapeHtml(block.name)}</b> <code>${summary}</code></summary>\n\n${fenced(inputJson, 'json')}\n\n</details>`;
		}
		case 'image':
			return `*[image: ${block.source.media_type}]*`;
		case 'tool_result':
			return '';
	}
}

function assistantMessageToMarkdown(msg: ConversationMessage): string {
	return getBlocks(msg.content)
		.map(assistantBlockToMarkdown)
		.filter(Boolean)
		.join('\n\n');
}

function deriveTitle(messages: ConversationMessage[], meta?: SessionMeta): string {
	if (meta?.summary) return meta.summary;
	for (const msg of messages) {
		if (msg.role !== 'user') continue;
		// Only derive the title from plain prose, not slash-command/stdout wrapper messages
		const text = getBlocks(msg.content)
			.filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text' && !!b.text)
			.map((b) => b.text)
			.join(' ');
		if (/^\s*<(local-command-caveat|command-name|local-command-stdout)>/.test(text)) continue;
		const cleaned = cleanUserText(text).replace(/\s+/g, ' ').trim();
		if (cleaned) return cleaned.length > 80 ? `${cleaned.slice(0, 80)}…` : cleaned;
	}
	return 'Claude Code session';
}

export function sessionToMarkdown(input: SessionMarkdownInput): string {
	const { sessionId, projectName, messages, meta } = input;

	const firstTs = formatTimestamp(messages[0]?.timestamp ?? '');
	const lastTs = formatTimestamp(messages[messages.length - 1]?.timestamp ?? '');

	const headerLines = [
		`# ${deriveTitle(messages, meta)}`,
		'',
		`**Project:** \`${projectName}\`  `,
		`**Session:** \`${sessionId}\`  `
	];
	if (firstTs) {
		headerLines.push(`**Date:** ${firstTs}${lastTs && lastTs !== firstTs ? ` → ${lastTs}` : ''}  `);
	}
	headerLines.push(`**Messages:** ${messages.length}  `);
	if (meta?.input_tokens || meta?.output_tokens) {
		headerLines.push(
			`**Tokens:** ${meta.input_tokens?.toLocaleString() ?? 0} in / ${meta.output_tokens?.toLocaleString() ?? 0} out  `
		);
	}
	headerLines.push('', '---', '');

	const sections: string[] = [];
	for (const msg of messages) {
		const ts = formatTimestamp(msg.timestamp);
		if (msg.role === 'user') {
			const body = userMessageToMarkdown(msg);
			if (!body) continue;
			sections.push(`### 👤 User${ts ? ` · ${ts}` : ''}\n\n${body}`);
		} else if (msg.role === 'assistant') {
			const body = assistantMessageToMarkdown(msg);
			if (!body) continue;
			const model = msg.model ? ` (\`${msg.model.replace('claude-', '')}\`)` : '';
			sections.push(`### ✦ Claude${model}${ts ? ` · ${ts}` : ''}\n\n${body}`);
		}
	}

	return `${headerLines.join('\n')}${sections.join('\n\n')}\n`;
}
