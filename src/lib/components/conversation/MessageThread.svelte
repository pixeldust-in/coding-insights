<script lang="ts">
	import { tick } from 'svelte';
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
		onLoadMore?: (limit?: number) => Promise<void>;
		hideTools?: boolean;
	} = $props();

	let loading = $state(false);
	let expandDiffs = $state(false);

	let visibleMessages = $derived(
		hideTools ? messages.filter((m) => m.role !== 'assistant' || hasNonToolContent(m)) : messages
	);

	let jumping = $state(false);
	let scrollY = $state(0);
	let innerHeight = $state(0);
	let docHeight = $state(0);
	let bottomEl: HTMLDivElement | undefined = $state();

	const hasMore = $derived(messages.length < totalCount);
	const nearTop = $derived(scrollY < 400);
	const nearBottom = $derived(!hasMore && scrollY + innerHeight >= docHeight - 400);

	function measure() {
		docHeight = document.documentElement.scrollHeight;
	}

	async function handleLoadMore() {
		if (!onLoadMore || loading) return;
		loading = true;
		try {
			await onLoadMore();
		} finally {
			loading = false;
		}
	}

	async function jumpToBottom() {
		if (jumping) return;
		jumping = true;
		try {
			if (hasMore && onLoadMore) {
				loading = true;
				try {
					await onLoadMore(totalCount - messages.length);
				} finally {
					loading = false;
				}
				await tick();
			}
			bottomEl?.scrollIntoView({ block: 'end' });
		} finally {
			jumping = false;
		}
	}

	function jumpToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		// Re-measure when the rendered list changes
		visibleMessages.length;
		tick().then(measure);
	});
</script>

<svelte:window bind:scrollY bind:innerHeight onresize={measure} onscroll={measure} />

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
	<div bind:this={bottomEl}></div>
</div>

<!-- Floating jump controls -->
{#if !nearTop || !nearBottom}
	<div class="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
		{#if !nearTop}
			<button
				onclick={jumpToTop}
				class="jump-btn"
				title="Jump to top"
				aria-label="Jump to top"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
					<path d="M3.22 9.78a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L8 6.06 4.28 9.78a.75.75 0 01-1.06 0z" />
				</svg>
			</button>
		{/if}
		{#if !nearBottom}
			<button
				onclick={jumpToBottom}
				disabled={jumping}
				class="jump-btn"
				title={hasMore ? `Load all ${totalCount - messages.length} remaining and jump to end` : 'Jump to end'}
				aria-label="Jump to end of conversation"
			>
				{#if jumping}
					<svg class="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M8 1.5a6.5 6.5 0 106.5 6.5" stroke-linecap="round" />
					</svg>
				{:else}
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z" />
					</svg>
				{/if}
			</button>
		{/if}
	</div>
{/if}

<style>
	.jump-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}
	.jump-btn:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}
	.jump-btn:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
