<script lang="ts">
	import { formatDateTime } from '$utils/format.js';
	import type { ContentBlock } from '$lib/server/types.js';

	let { content, timestamp }: { content: string | ContentBlock[]; timestamp: string } = $props();

	function getTextContent(c: string | ContentBlock[]): string {
		if (typeof c === 'string') return c;
		return c
			.filter((b): b is { type: 'text'; text: string } => b.type === 'text')
			.map((b) => b.text)
			.join('\n');
	}

	interface ParsedContent {
		type: 'text' | 'command' | 'caveat' | 'stdout';
		text: string;
		commandName?: string;
		commandArgs?: string;
	}

	function stripAnsi(text: string): string {
		return text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\[[\d;]*m/g, '');
	}

	function parseUserContent(raw: string): ParsedContent[] {
		const parts: ParsedContent[] = [];

		// Check for local-command-caveat (hide entirely)
		if (raw.match(/^<local-command-caveat>.*<\/local-command-caveat>$/s)) {
			return [];
		}

		// Check for command-name pattern
		const cmdMatch = raw.match(
			/<command-name>(\/[^<]+)<\/command-name>\s*<command-message>([^<]*)<\/command-message>\s*<command-args>([^<]*)<\/command-args>/s
		);
		if (cmdMatch) {
			parts.push({
				type: 'command',
				text: cmdMatch[2].trim(),
				commandName: cmdMatch[1].trim(),
				commandArgs: cmdMatch[3].trim()
			});
			return parts;
		}

		// Check for local-command-stdout
		const stdoutMatch = raw.match(/<local-command-stdout>([\s\S]*?)(<\/local-command-stdout>)?$/);
		if (stdoutMatch) {
			const cleaned = stripAnsi(stdoutMatch[1]).trim();
			if (cleaned) {
				parts.push({ type: 'stdout', text: cleaned });
			}
			return parts;
		}

		// Plain text — strip any remaining XML-like system tags
		const cleaned = raw
			.replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, '')
			.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
			.trim();

		if (cleaned) {
			parts.push({ type: 'text', text: cleaned });
		}
		return parts;
	}

	const text = $derived(getTextContent(content));
	const parsed = $derived(parseUserContent(text));
</script>

{#if parsed.length > 0}
	<div class="flex gap-3">
		<div
			class="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5 font-mono"
		>
			U
		</div>
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-medium text-text-secondary">You</span>
				<span class="text-[10px] text-text-muted font-mono">{formatDateTime(timestamp)}</span>
			</div>
			{#each parsed as part}
				{#if part.type === 'text'}
					<div class="text-sm text-text whitespace-pre-wrap break-words">
						{part.text}
					</div>
				{:else if part.type === 'command'}
					<div
						class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 font-mono text-sm"
					>
						<span class="text-accent font-semibold">{part.commandName}</span>
						{#if part.commandArgs}
							<span class="text-text-secondary">{part.commandArgs}</span>
						{/if}
					</div>
				{:else if part.type === 'stdout'}
					<div
						class="mt-1 rounded-lg bg-bg border border-border-subtle p-3 font-mono text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap"
					>
						{part.text}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}
