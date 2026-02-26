<script lang="ts">
	import { formatDateTime } from '$utils/format.js';
	import ThinkingBlock from './ThinkingBlock.svelte';
	import ToolCallCard from './ToolCallCard.svelte';
	import ImageBlock from './ImageBlock.svelte';
	import TokenBadge from './TokenBadge.svelte';
	import type { ContentBlock } from '$lib/server/types.js';

	let {
		content,
		timestamp,
		model,
		tokens,
		expandDiffs = false
	}: {
		content: string | ContentBlock[];
		timestamp: string;
		model?: string;
		tokens?: { input?: number; output?: number };
		expandDiffs?: boolean;
	} = $props();

	function getBlocks(c: string | ContentBlock[]): ContentBlock[] {
		if (typeof c === 'string') return [{ type: 'text', text: c }];
		return c;
	}
</script>

<div class="flex gap-3">
	<div
		class="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-xs text-accent shrink-0 mt-0.5 font-semibold"
	>
		✦
	</div>
	<div class="flex-1 min-w-0">
		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-medium text-accent">Claude</span>
			{#if model}
				<span
					class="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono"
				>
					{model.replace('claude-', '')}
				</span>
			{/if}
			<span class="text-[10px] text-text-muted font-mono">{formatDateTime(timestamp)}</span>
			<TokenBadge input={tokens?.input} output={tokens?.output} />
		</div>

		<div class="space-y-1">
			{#each getBlocks(content) as block}
				{#if block.type === 'thinking'}
					<ThinkingBlock content={block.thinking} />
				{:else if block.type === 'tool_use'}
					<ToolCallCard name={block.name} input={block.input} {expandDiffs} />
				{:else if block.type === 'tool_result'}
					<!-- Tool results are shown inline in tool call cards -->
				{:else if block.type === 'image'}
					<ImageBlock mediaType={block.source.media_type} data={block.source.data} />
				{:else if block.type === 'text' && block.text}
					{#if block.renderedHtml}
						<div class="prose text-sm">
							{@html block.renderedHtml}
						</div>
					{:else}
						<div class="text-sm text-text whitespace-pre-wrap break-words">
							{block.text}
						</div>
					{/if}
				{/if}
			{/each}
		</div>
	</div>
</div>
