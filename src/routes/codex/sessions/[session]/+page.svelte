<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import Badge from '$components/shared/Badge.svelte';
	import MessageThread from '$components/conversation/MessageThread.svelte';
	import type { ConversationMessage } from '$lib/server/types.js';

	let { data } = $props();

	let extraMessages = $state<ConversationMessage[]>([]);
	let allMessages = $derived([...data.messages, ...extraMessages]);
	let totalCount = $derived(data.totalCount);

	async function loadMore() {
		const offset = allMessages.length;
		const res = await fetch(
			`/api/codex/sessions/${data.sessionId}/messages?offset=${offset}&limit=50`
		);
		const json = await res.json();
		extraMessages = [...extraMessages, ...json.messages];
	}
</script>

<Header
	breadcrumbs={[
		{ label: 'Sessions', href: '/codex/sessions' },
		{ label: data.meta?.firstPrompt?.slice(0, 40) || data.sessionId.slice(0, 8) }
	]}
/>

<div class="p-6 space-y-6">
	<!-- Session Meta Bar -->
	{#if data.meta}
		<div class="bg-surface border border-border-subtle rounded-xl p-4 card-elevated">
			<div class="flex flex-wrap items-center gap-3">
				<Badge variant="accent">{data.meta.projectName}</Badge>
				{#if data.meta.model}
					<Badge>{data.meta.model}</Badge>
				{/if}
				<span class="text-xs text-text-muted">{data.meta.messageCount} messages</span>
				<span class="text-xs text-text-muted font-mono">{data.meta.cwd}</span>
			</div>
		</div>
	{/if}

	<!-- Messages -->
	<MessageThread messages={allMessages} {totalCount} onLoadMore={loadMore} />
</div>
