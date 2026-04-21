<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import SummaryCard from '$components/analytics/SummaryCard.svelte';
	import Badge from '$components/shared/Badge.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import TerminalSelect from '$components/shared/TerminalSelect.svelte';
	import { relativeTime, formatDuration, formatNumber, formatTokens } from '$utils/format.js';

	let { data } = $props();

	let search = $state('');
	let sortBy = $state<'date' | 'messages'>('date');

	const sortOptions = [
		{ value: 'date', label: 'Sort by Date' },
		{ value: 'messages', label: 'Sort by Messages' }
	];

	let metrics = $derived.by(() => {
		const sessions = data.sessions;
		let messages = 0, tokens = 0, duration = 0, lines = 0;
		for (const s of sessions) {
			messages += s.messageCount;
			tokens += (s.inputTokens ?? 0) + (s.outputTokens ?? 0);
			duration += s.durationMinutes ?? 0;
			lines += (s.linesAdded ?? 0) + (s.linesRemoved ?? 0);
		}
		return { messages, tokens, duration, lines, avgDuration: sessions.length ? duration / sessions.length : 0 };
	});

	let filtered = $derived.by(() => {
		let list = data.sessions;
		if (search) {
			const q = search.toLowerCase();
			list = list.filter(
				(s) =>
					s.firstPrompt.toLowerCase().includes(q) ||
					s.summary.toLowerCase().includes(q) ||
					s.gitBranch?.toLowerCase().includes(q)
			);
		}
		if (sortBy === 'messages') {
			list = [...list].sort((a, b) => b.messageCount - a.messageCount);
		}
		return list;
	});
</script>

<Header
	breadcrumbs={[
		{ label: 'Projects', href: '/claude/projects' },
		{ label: data.displayName }
	]}
/>

<div class="p-6 space-y-4">
	<!-- Project Metrics -->
	<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
		<SummaryCard icon="◈" label="Sessions" value={formatNumber(data.sessions.length)} />
		<SummaryCard icon="✉" label="Messages" value={formatNumber(metrics.messages)} />
		<SummaryCard icon="◎" label="Total Tokens" value={formatTokens(metrics.tokens)} />
		<SummaryCard icon="◷" label="Time Spent" value={formatDuration(metrics.duration)} />
		<SummaryCard icon="±" label="Lines Changed" value={formatNumber(metrics.lines)} />
		<SummaryCard icon="⌀" label="Avg Session" value={formatDuration(metrics.avgDuration)} />
	</div>

	<!-- Filters -->
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search sessions..." class="w-72" />
		<TerminalSelect bind:value={sortBy} options={sortOptions} />
		<span class="text-xs text-text-muted ml-auto">{data.sessions.length} sessions</span>
	</div>

	<!-- Session List -->
	<div class="space-y-2">
		{#each filtered as session}
			<a
				href="/claude/projects/{encodeURIComponent(data.projectDir)}/{session.sessionId}"
				class="block bg-surface border border-border-subtle rounded-xl p-4 hover:border-accent/50 transition-all group card-elevated"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium truncate group-hover:text-accent transition-colors">
							{session.firstPrompt || 'No prompt'}
						</p>
						{#if session.summary}
							<p class="text-xs text-text-muted mt-1 truncate">{session.summary}</p>
						{/if}
					</div>
					<div class="flex items-center gap-2 shrink-0">
						{#if session.gitBranch}
							<Badge variant="accent">{session.gitBranch}</Badge>
						{/if}
						{#if session.outcome === 'fully_achieved'}
							<Badge variant="success">completed</Badge>
						{:else if session.outcome === 'partially_achieved'}
							<Badge variant="warning">partial</Badge>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-4 mt-3 text-xs text-text-muted">
					<span>{session.messageCount} messages</span>
					{#if session.durationMinutes}
						<span>{formatDuration(session.durationMinutes)}</span>
					{/if}
					{#if session.toolCounts && Object.keys(session.toolCounts).length > 0}
						<span class="flex items-center gap-1">
							{#each Object.entries(session.toolCounts).slice(0, 4) as [tool, count]}
								<span class="bg-surface-hover px-1.5 py-0.5 rounded text-[10px]"
									>{tool}:{count}</span
								>
							{/each}
						</span>
					{/if}
					<span class="ml-auto">{relativeTime(session.modified || session.created)}</span>
				</div>
			</a>
		{/each}
	</div>
</div>
