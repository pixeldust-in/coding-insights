<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import DateRangeFilter from '$components/shared/DateRangeFilter.svelte';
	import SessionRow from '$components/shared/SessionRow.svelte';
	import { defaultRange, inRange, isRangeActive, type RangeState } from '$utils/date-range.js';

	let { data } = $props();

	let search = $state('');
	let range = $state<RangeState>(defaultRange());

	let filtered = $derived.by(() => {
		let list = data.history;
		if (search) {
			const q = search.toLowerCase();
			list = list.filter((h) => h.display.toLowerCase().includes(q));
		}
		if (isRangeActive(range)) {
			list = list.filter((h) => inRange(h.timestamp, range));
		}
		return list;
	});

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function projectName(path: string): string {
		if (!path) return '';
		const parts = path.replace(/\/$/, '').split('/');
		return parts[parts.length - 1] || '';
	}

	function groupByDate(entries: typeof data.history): Map<string, typeof data.history> {
		const groups = new Map<string, typeof data.history>();
		const now = new Date();
		const today = now.toDateString();
		const yesterday = new Date(now.getTime() - 86400000).toDateString();

		for (const entry of entries) {
			const d = new Date(entry.timestamp);
			const ds = d.toDateString();
			let label: string;
			if (ds === today) label = 'Today';
			else if (ds === yesterday) label = 'Yesterday';
			else label = formatDate(entry.timestamp);

			const group = groups.get(label) || [];
			group.push(entry);
			groups.set(label, group);
		}
		return groups;
	}

	let grouped = $derived(groupByDate(filtered));
</script>

<Header breadcrumbs={[{ label: 'History' }]} />

<div class="p-6 space-y-4">
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search prompts..." class="w-80" />
		<DateRangeFilter bind:range />
		<span class="text-xs font-mono text-text-muted ml-auto">
			{filtered.length} of {data.history.length} entries
		</span>
	</div>

	{#each [...grouped.entries()] as [dateLabel, entries]}
		<div>
			<div class="flex items-center gap-3 mb-2 px-0.5">
				<h3 class="text-[11px] text-text-secondary font-mono font-semibold uppercase tracking-[0.1em]">
					{dateLabel}
				</h3>
				<span class="text-[10.5px] font-mono text-text-muted">{entries.length}</span>
				<span class="flex-1 h-px bg-border-subtle"></span>
			</div>
			<div class="border border-border-subtle rounded-xl overflow-hidden bg-surface card-elevated">
				{#each entries as entry}
					<SessionRow
						href="/claude/sessions/{entry.sessionId}"
						prompt={entry.display}
						projectName={projectName(entry.project)}
						time={new Date(entry.timestamp).toISOString()}
					/>
				{/each}
			</div>
		</div>
	{/each}

	{#if search && filtered.length === 0}
		<div class="text-center py-12 text-text-muted text-sm">
			No prompts matching "{search}"
		</div>
	{/if}
</div>
