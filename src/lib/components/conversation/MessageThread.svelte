<script lang="ts">
	import UserMessage from './UserMessage.svelte';
	import AssistantMessage from './AssistantMessage.svelte';
	import { hasNonToolContent } from '$utils/message-filter.js';
	import type { ConversationMessage } from '$lib/server/types.js';

	let {
		messages,
		totalCount,
		onLoadMore,
		hideTools = $bindable(false)
	}: {
		messages: ConversationMessage[];
		totalCount: number;
		onLoadMore?: () => void;
		hideTools?: boolean;
	} = $props();

	let loading = $state(false);
	let expandDiffs = $state(false);

	let visibleMessages = $derived(
		hideTools ? messages.filter((m) => m.role !== 'assistant' || hasNonToolContent(m)) : messages
	);

	async function handleLoadMore() {
		if (onLoadMore) {
			loading = true;
			onLoadMore();
			loading = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- View toggles -->
	<div class="flex items-center justify-end gap-2">
		<button
			onclick={() => (hideTools = !hideTools)}
			class="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer {hideTools
				? 'border-accent/40 bg-accent/10 text-accent'
				: 'border-border-subtle bg-surface text-text-muted hover:text-text-secondary hover:border-border'}"
			title="Show only user and assistant messages"
		>
			<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
				<path
					d="M1.75 2.5h12.5a.75.75 0 010 1.5H1.75a.75.75 0 010-1.5zm2.5 4.5h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5zm2.5 4.5h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 010-1.5z"
				/>
			</svg>
			Hide tools
		</button>
		<button
			onclick={() => (expandDiffs = !expandDiffs)}
			class="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer {expandDiffs
				? 'border-accent/40 bg-accent/10 text-accent'
				: 'border-border-subtle bg-surface text-text-muted hover:text-text-secondary hover:border-border'}"
		>
			<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8.75 1.75a.75.75 0 00-1.5 0V5H4a.75.75 0 000 1.5h3.25v3.25a.75.75 0 001.5 0V6.5H12A.75.75 0 0012 5H8.75V1.75z" class="{expandDiffs ? 'diff-marker-add' : ''}" />
				<path d="M4 11a.75.75 0 000 1.5h8a.75.75 0 000-1.5H4z" class="{expandDiffs ? 'diff-marker-remove' : ''}" />
			</svg>
			Show diffs
		</button>
	</div>

	{#each visibleMessages as msg (msg.id)}
		<div class="py-2">
			{#if msg.role === 'user'}
				<UserMessage content={msg.content} timestamp={msg.timestamp} />
			{:else if msg.role === 'assistant'}
				<AssistantMessage
					content={msg.content}
					timestamp={msg.timestamp}
					model={msg.model}
					tokens={msg.tokens}
					{expandDiffs}
					{hideTools}
				/>
			{/if}
		</div>
	{/each}

	{#if messages.length < totalCount}
		<div class="flex justify-center py-4">
			<button
				onclick={handleLoadMore}
				disabled={loading}
				class="px-4 py-2 text-sm text-accent font-mono border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50 cursor-pointer"
			>
				{loading ? 'Loading...' : `Load more (${totalCount - messages.length} remaining)`}
			</button>
		</div>
	{/if}
</div>
