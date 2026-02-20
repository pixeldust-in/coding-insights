<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';

	let { data } = $props();

	let search = $state('');

	let filtered = $derived(() => {
		if (!search) return data.history;
		const q = search.toLowerCase();
		return data.history.filter((h) => h.text.toLowerCase().includes(q));
	});

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(ts: number): string {
		return new Date(ts * 1000).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function groupByDate(entries: typeof data.history): Map<string, typeof data.history> {
		const groups = new Map<string, typeof data.history>();
		const now = new Date();
		const today = now.toDateString();
		const yesterday = new Date(now.getTime() - 86400000).toDateString();

		for (const entry of entries) {
			const d = new Date(entry.ts * 1000);
			const ds = d.toDateString();
			let label: string;
			if (ds === today) label = 'Today';
			else if (ds === yesterday) label = 'Yesterday';
			else label = formatDate(entry.ts);

			const group = groups.get(label) || [];
			group.push(entry);
			groups.set(label, group);
		}
		return groups;
	}

	let grouped = $derived(groupByDate(filtered()));
</script>

<Header breadcrumbs={[{ label: 'History' }]} />

<div class="p-6 space-y-4">
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search prompts..." class="w-80" />
		<span class="text-xs text-text-muted ml-auto">
			{filtered().length} of {data.history.length} entries
		</span>
	</div>

	{#each [...grouped.entries()] as [dateLabel, entries]}
		<div>
			<h3 class="text-xs text-text-muted font-medium uppercase tracking-wider mb-2">{dateLabel}</h3>
			<div class="space-y-1.5">
				{#each entries as entry}
					<a
						href="/codex/sessions/{entry.session_id}"
						class="block bg-surface border border-border-subtle rounded-lg px-4 py-3 hover:border-accent/50 transition-all group card-elevated"
					>
						<p class="text-sm text-text group-hover:text-accent transition-colors line-clamp-2">
							{entry.text}
						</p>
						<div class="flex items-center gap-3 mt-2 text-[10px] text-text-muted font-mono">
							<span>{formatTime(entry.ts)}</span>
							<span class="truncate max-w-48">{entry.session_id.slice(0, 8)}</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/each}

	{#if search && filtered().length === 0}
		<div class="text-center py-12 text-text-muted text-sm">
			No prompts matching "{search}"
		</div>
	{/if}
</div>
