<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import SessionRow from '$components/shared/SessionRow.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import TerminalSelect from '$components/shared/TerminalSelect.svelte';
	import DateRangeFilter from '$components/shared/DateRangeFilter.svelte';
	import { defaultRange, inRange, isRangeActive, type RangeState } from '$utils/date-range.js';

	let { data } = $props();

	let search = $state('');
	let projectFilter = $state('all');
	let range = $state<RangeState>(defaultRange());
	let sortBy = $state<'date' | 'messages'>('date');

	let uniqueProjects = $derived(
		[...new Set(data.sessions.map((s) => s.projectName).filter(Boolean))].sort()
	);

	let projectOptions = $derived([
		{ value: 'all', label: 'All Projects' },
		...uniqueProjects.map((p) => ({ value: p!, label: p! }))
	]);

	const sortOptions = [
		{ value: 'date', label: 'Sort by Date' },
		{ value: 'messages', label: 'Sort by Messages' }
	];

	let filtered = $derived.by(() => {
		let list = data.sessions;

		if (search) {
			const q = search.toLowerCase();
			list = list.filter(
				(s) =>
					s.firstPrompt.toLowerCase().includes(q) ||
					s.summary.toLowerCase().includes(q) ||
					(s.gitBranch?.toLowerCase().includes(q) ?? false)
			);
		}

		if (projectFilter !== 'all') {
			list = list.filter((s) => s.projectName === projectFilter);
		}

		if (isRangeActive(range)) {
			list = list.filter((s) => inRange(s.modified || s.created, range));
		}

		if (sortBy === 'messages') {
			list = [...list].sort((a, b) => b.messageCount - a.messageCount);
		}

		return list;
	});
</script>

<Header breadcrumbs={[{ label: 'Sessions' }]} />

<div class="p-6 space-y-4">
	<!-- Filters -->
	<div class="flex items-center gap-3 flex-wrap">
		<TerminalSearch bind:value={search} placeholder="Search sessions..." class="w-72" />
		<TerminalSelect bind:value={projectFilter} options={projectOptions} />
		<DateRangeFilter bind:range />
		<TerminalSelect bind:value={sortBy} options={sortOptions} />
		<span class="text-xs font-mono text-text-muted ml-auto">{filtered.length} sessions</span>
	</div>

	<!-- Session List -->
	{#if filtered.length > 0}
		<div class="border border-border-subtle rounded-xl overflow-hidden bg-surface card-elevated">
			{#each filtered as session}
				<SessionRow
					href="/claude/sessions/{session.sessionId}"
					prompt={session.firstPrompt}
					projectName={session.projectName ?? ''}
					messageCount={session.messageCount}
					durationMinutes={session.durationMinutes}
					outcome={session.outcome as 'fully_achieved' | 'partially_achieved' | undefined}
					time={session.modified || session.created}
				/>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12 text-text-muted text-sm">
			No sessions matching "{search}"
		</div>
	{/if}
</div>
