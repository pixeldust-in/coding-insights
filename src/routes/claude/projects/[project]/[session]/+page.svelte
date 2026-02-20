<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import Badge from '$components/shared/Badge.svelte';
	import MessageThread from '$components/conversation/MessageThread.svelte';
	import { formatTokens, formatDuration, formatNumber } from '$utils/format.js';
	import type { ConversationMessage } from '$lib/server/types.js';

	let { data } = $props();

	let extraMessages = $state<ConversationMessage[]>([]);
	let allMessages = $derived([...data.messages, ...extraMessages]);
	let totalCount = $derived(data.totalCount);

	async function loadMore() {
		const offset = allMessages.length;
		const res = await fetch(
			`/api/claude/sessions/${encodeURIComponent(data.projectDir)}/${data.sessionId}/messages?offset=${offset}&limit=50`
		);
		const json = await res.json();
		extraMessages = [...extraMessages, ...json.messages];
	}
</script>

<Header
	breadcrumbs={[
		{ label: 'Projects', href: '/claude/projects' },
		{ label: data.displayName, href: `/claude/projects/${encodeURIComponent(data.projectDir)}` },
		{ label: data.sessionId.slice(0, 8) }
	]}
/>

<div class="p-6 space-y-6">
	<!-- Session Title Card -->
	{#if data.firstPrompt || data.meta?.summary}
		<div class="bg-surface border border-border-subtle rounded-xl p-4 card-elevated">
			<p class="text-sm font-medium truncate">
				{data.meta?.summary || data.firstPrompt}
			</p>
			<div class="flex items-center gap-4 mt-2 text-xs text-text-muted">
				<span>{data.totalCount} messages</span>
			</div>
		</div>
	{/if}

	<!-- Session Meta Bar -->
	{#if data.meta || data.facets}
	<div class="bg-surface border border-border-subtle rounded-xl p-4 card-elevated">
		<div class="flex flex-wrap items-center gap-3">
			{#if data.meta}
				{#if data.meta.summary}
					<span class="text-sm font-medium">{data.meta.summary}</span>
					<span class="text-border">|</span>
				{/if}
				<span class="text-xs text-text-muted">
					{data.meta.user_message_count + data.meta.assistant_message_count} messages
				</span>
				{#if data.meta.duration_minutes}
					<span class="text-xs text-text-muted">{formatDuration(data.meta.duration_minutes)}</span>
				{/if}
				{#if data.meta.input_tokens || data.meta.output_tokens}
					<span class="text-xs text-text-muted">
						{formatTokens(data.meta.input_tokens)} in / {formatTokens(data.meta.output_tokens)} out
					</span>
				{/if}
			{/if}

			{#if data.facets}
				{#if data.facets.outcome}
					<Badge
						variant={data.facets.outcome === 'fully_achieved'
							? 'success'
							: data.facets.outcome === 'partially_achieved'
								? 'warning'
								: 'default'}
					>
						{data.facets.outcome.replace('_', ' ')}
					</Badge>
				{/if}
			{/if}
		</div>

		{#if data.meta}
			<div class="flex flex-wrap gap-2 mt-3">
				{#if data.meta.tool_counts && Object.keys(data.meta.tool_counts).length > 0}
					{#each Object.entries(data.meta.tool_counts) as [tool, count]}
						<span class="bg-surface-hover px-2 py-0.5 rounded text-xs text-text-muted font-mono">
							{tool}: {count}
						</span>
					{/each}
				{/if}
			</div>

			{#if data.meta.languages && Object.keys(data.meta.languages).length > 0}
				<div class="flex flex-wrap gap-2 mt-2">
					{#each Object.entries(data.meta.languages) as [lang, count]}
						<Badge variant="accent">{lang} ({count})</Badge>
					{/each}
				</div>
			{/if}

			{#if data.meta.lines_added || data.meta.lines_removed || data.meta.files_modified}
				<div class="flex gap-4 mt-2 text-xs text-text-muted">
					{#if data.meta.files_modified}<span>{data.meta.files_modified} files changed</span>{/if}
					{#if data.meta.lines_added}<span class="text-success">+{formatNumber(data.meta.lines_added)}</span>{/if}
					{#if data.meta.lines_removed}<span class="text-error">-{formatNumber(data.meta.lines_removed)}</span>{/if}
				</div>
			{/if}
		{/if}

		{#if data.facets?.brief_summary}
			<p class="text-xs text-text-secondary mt-3 leading-relaxed">
				{data.facets.brief_summary}
			</p>
		{/if}
	</div>
	{/if}

	<!-- Messages -->
	<MessageThread messages={allMessages} {totalCount} onLoadMore={loadMore} />
</div>
