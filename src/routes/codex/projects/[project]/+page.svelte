<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import Badge from '$components/shared/Badge.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import TerminalSelect from '$components/shared/TerminalSelect.svelte';
	import { relativeTime } from '$utils/format.js';

	let { data } = $props();

	let search = $state('');
	let sortBy = $state<'date' | 'messages'>('date');

	const sortOptions = [
		{ value: 'date', label: 'Sort by Date' },
		{ value: 'messages', label: 'Sort by Messages' }
	];

	let filtered = $derived(() => {
		let list = data.sessions;
		if (search) {
			const q = search.toLowerCase();
			list = list.filter(
				(s) =>
					s.firstPrompt.toLowerCase().includes(q) ||
					s.model.toLowerCase().includes(q)
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
		{ label: 'Projects', href: '/codex/projects' },
		{ label: data.displayName }
	]}
/>

<div class="p-6 space-y-4">
	<!-- Filters -->
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search sessions..." class="w-72" />
		<TerminalSelect bind:value={sortBy} options={sortOptions} />
		<span class="text-xs text-text-muted ml-auto">{data.sessions.length} sessions</span>
	</div>

	<!-- Session List -->
	<div class="space-y-2">
		{#each filtered() as session}
			<a
				href="/codex/sessions/{session.sessionId}"
				class="block bg-surface border border-border-subtle rounded-xl p-4 hover:border-accent/50 transition-all group card-elevated"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium truncate group-hover:text-accent transition-colors">
							{session.firstPrompt || 'No prompt'}
						</p>
					</div>
					<div class="flex items-center gap-2 shrink-0">
						{#if session.model}
							<Badge>{session.model}</Badge>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-4 mt-3 text-xs text-text-muted">
					<span>{session.messageCount} messages</span>
					<span class="ml-auto">{relativeTime(session.timestamp)}</span>
				</div>
			</a>
		{/each}
	</div>

	{#if search && filtered().length === 0}
		<div class="text-center py-12 text-text-muted text-sm">
			No sessions matching "{search}"
		</div>
	{/if}
</div>
