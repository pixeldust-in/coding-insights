<script lang="ts">
	import { onMount } from 'svelte';
	import UserMessage from '$components/conversation/UserMessage.svelte';
	import ImageBlock from '$components/conversation/ImageBlock.svelte';
	import { formatDateTime, formatTokens } from '$utils/format.js';
	import { formatToolInput } from '$utils/tool-format.js';
	import type { ContentBlock } from '$lib/server/types.js';

	let { data } = $props();

	function getBlocks(c: string | ContentBlock[]): ContentBlock[] {
		if (typeof c === 'string') return [{ type: 'text', text: c }];
		return c;
	}

	// Print output should always be light-themed; restore the user's theme on leave.
	onMount(() => {
		const hadLight = document.documentElement.classList.contains('light');
		document.documentElement.classList.add('light');
		return () => {
			if (!hadLight) document.documentElement.classList.remove('light');
		};
	});
</script>

<svelte:head>
	<title>Transcript · {data.meta?.summary || data.firstPrompt || data.sessionId.slice(0, 8)}</title>
</svelte:head>

<!-- Toolbar (screen only) -->
<div
	class="print:hidden sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-3 bg-surface border-b border-border-subtle"
>
	<a
		href={`/claude/projects/${encodeURIComponent(data.projectDir)}/${data.sessionId}`}
		class="text-xs text-text-muted hover:text-text-secondary font-mono"
	>
		← Back to session
	</a>
	<div class="flex items-center gap-2">
		<a
			href={`/api/claude/sessions/${encodeURIComponent(data.projectDir)}/${data.sessionId}/export`}
			class="px-3 py-1.5 text-xs font-mono rounded-lg border border-border-subtle bg-surface text-text-muted hover:text-text-secondary hover:border-border transition-colors"
		>
			↓ Markdown
		</a>
		<button
			onclick={() => window.print()}
			class="px-3 py-1.5 text-xs font-mono rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
		>
			Save as PDF
		</button>
	</div>
</div>

<div class="max-w-3xl mx-auto px-8 py-10 bg-bg min-h-screen">
	<!-- Document header -->
	<header class="mb-8 pb-6 border-b border-border">
		<h1 class="text-xl font-semibold leading-snug">
			{data.meta?.summary || data.firstPrompt || 'Claude Code session'}
		</h1>
		<div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-text-muted font-mono">
			<span>{data.displayName}</span>
			<span>{data.sessionId}</span>
			<span>{data.totalCount} messages</span>
			{#if data.messages[0]?.timestamp}
				<span>{formatDateTime(data.messages[0].timestamp)}</span>
			{/if}
			{#if data.meta?.input_tokens || data.meta?.output_tokens}
				<span>{formatTokens(data.meta.input_tokens)} in / {formatTokens(data.meta.output_tokens)} out</span>
			{/if}
		</div>
	</header>

	<!-- Transcript -->
	<div class="space-y-8">
		{#each data.messages as msg (msg.id)}
			{#if msg.role === 'user'}
				<div class="message-block">
					<UserMessage content={msg.content} timestamp={msg.timestamp} />
				</div>
			{:else if msg.role === 'assistant'}
				<div class="message-block flex gap-3">
					<div
						class="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-xs text-accent shrink-0 mt-0.5 font-semibold"
					>
						✦
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<span class="text-xs font-medium text-accent">Claude</span>
							{#if msg.model}
								<span class="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono">
									{msg.model.replace('claude-', '')}
								</span>
							{/if}
							<span class="text-[10px] text-text-muted font-mono">{formatDateTime(msg.timestamp)}</span>
						</div>

						<div class="space-y-2">
							{#each getBlocks(msg.content) as block}
								{#if block.type === 'thinking' && block.thinking?.trim()}
									<div class="border border-border-subtle rounded-lg bg-surface px-3 py-2">
										<p class="text-[10px] uppercase tracking-wider text-text-muted font-mono mb-1">
											⟡ Thinking
										</p>
										<div class="text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
											{block.thinking}
										</div>
									</div>
								{:else if block.type === 'tool_use'}
									<div class="flex items-baseline gap-2 text-xs font-mono py-0.5 tool-line">
										<span class="text-text-muted shrink-0">▸</span>
										<span class="text-text-secondary font-medium shrink-0">{block.name}</span>
										<span class="text-text-muted break-all">{formatToolInput(block.name, block.input)}</span>
									</div>
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
			{/if}
		{/each}
	</div>
</div>

<style>
	@media print {
		:global(html) {
			background: #ffffff;
		}
		.message-block {
			break-inside: avoid-page;
		}
		.tool-line {
			break-inside: avoid;
		}
	}
	@page {
		margin: 1.5cm;
	}
</style>
