<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import Badge from '$components/shared/Badge.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import { relativeTime, formatDuration } from '$utils/format.js';

	let { data } = $props();

	let search = $state('');
	let sortBy = $state<'date' | 'messages'>('date');

	let filtered = $derived(() => {
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
		{ label: 'Projects', href: '/projects' },
		{ label: data.displayName }
	]}
/>

<div class="p-6 space-y-4">
	<!-- Filters -->
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search sessions..." class="w-72" />
		<select
			bind:value={sortBy}
			class="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent/50"
		>
			<option value="date">Sort by Date</option>
			<option value="messages">Sort by Messages</option>
		</select>
		<span class="text-xs text-text-muted ml-auto">{data.sessions.length} sessions</span>
	</div>

	<!-- Session List -->
	<div class="space-y-2">
		{#each filtered() as session}
			<a
				href="/projects/{encodeURIComponent(data.projectDir)}/{session.sessionId}"
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
