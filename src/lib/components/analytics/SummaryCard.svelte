<script lang="ts">
	let {
		icon,
		label,
		value,
		subtitle = ''
	}: {
		icon: string;
		label: string;
		value: string | number;
		subtitle?: string;
	} = $props();
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</p>
			<p class="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
			{#if subtitle}
				<p class="text-text-muted text-xs mt-1">{subtitle}</p>
			{/if}
		</div>
		<span class="text-xl opacity-50">{icon}</span>
	</div>
</div>
