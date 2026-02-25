<script lang="ts">
	import Header from '$components/layout/Header.svelte';

	let { data } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<Header
	breadcrumbs={[{ label: 'Plans', href: '/claude/plans' }, { label: data.plan.title }]}
/>

<div class="p-6 space-y-4">
	<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
		<h2 class="text-lg font-semibold">{data.plan.title}</h2>
		<div class="flex items-center gap-3 mt-2 text-xs text-text-muted font-mono">
			<span>{data.plan.name}</span>
			<span>·</span>
			<span>{formatDate(data.plan.modifiedAt)}</span>
		</div>
	</div>

	<div class="bg-surface border border-border-subtle rounded-xl p-6 card-elevated">
		<div class="prose text-sm">
			{@html data.plan.renderedHtml}
		</div>
	</div>
</div>
