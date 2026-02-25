<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';

	let { data } = $props();

	let search = $state('');

	let filtered = $derived(() => {
		if (!search) return data.plans;
		const q = search.toLowerCase();
		return data.plans.filter(
			(p) => p.title.toLowerCase().includes(q) || p.preview.toLowerCase().includes(q) || p.projectName.toLowerCase().includes(q)
		);
	});

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Header breadcrumbs={[{ label: 'Plans' }]} />

<div class="p-6 space-y-4">
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search plans..." class="w-80" />
		<span class="text-xs text-text-muted ml-auto">
			{filtered().length} of {data.plans.length} plans
		</span>
	</div>

	<div class="space-y-2">
		{#each filtered() as plan}
			<a
				href="/codex/plans/{plan.id}"
				class="block bg-surface border border-border-subtle rounded-xl p-5 hover:border-accent/50 transition-all group card-elevated"
			>
				<h3 class="text-sm font-medium group-hover:text-accent transition-colors">
					{plan.title}
				</h3>
				{#if plan.preview}
					<p class="text-xs text-text-secondary mt-2 line-clamp-2">{plan.preview}</p>
				{/if}
				<div class="flex items-center gap-3 mt-3 text-[10px] text-text-muted font-mono">
					<span>{plan.projectName}</span>
					<span>·</span>
					<span>{formatDate(plan.timestamp)}</span>
					<span>{formatTime(plan.timestamp)}</span>
				</div>
			</a>
		{/each}
	</div>

	{#if data.plans.length === 0}
		<div class="text-center py-12 text-text-muted text-sm">
			No plans found in Codex session logs
		</div>
	{/if}

	{#if search && filtered().length === 0}
		<div class="text-center py-12 text-text-muted text-sm">
			No plans matching "{search}"
		</div>
	{/if}
</div>
