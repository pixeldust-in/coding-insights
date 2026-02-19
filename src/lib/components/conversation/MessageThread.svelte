<script lang="ts">
	import UserMessage from './UserMessage.svelte';
	import AssistantMessage from './AssistantMessage.svelte';
	import type { ConversationMessage } from '$lib/server/types.js';

	let {
		messages,
		totalCount,
		onLoadMore
	}: {
		messages: ConversationMessage[];
		totalCount: number;
		onLoadMore?: () => void;
	} = $props();

	let loading = $state(false);

	async function handleLoadMore() {
		if (onLoadMore) {
			loading = true;
			onLoadMore();
			loading = false;
		}
	}
</script>

<div class="space-y-6">
	{#each messages as msg (msg.id)}
		<div class="py-2">
			{#if msg.role === 'user'}
				<UserMessage content={msg.content} timestamp={msg.timestamp} />
			{:else if msg.role === 'assistant'}
				<AssistantMessage
					content={msg.content}
					timestamp={msg.timestamp}
					model={msg.model}
					tokens={msg.tokens}
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
