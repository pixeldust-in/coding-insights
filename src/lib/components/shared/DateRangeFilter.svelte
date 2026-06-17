<script lang="ts">
	import TerminalSelect from './TerminalSelect.svelte';
	import { dateRangeOptions, type RangeState } from '$utils/date-range.js';

	let { range = $bindable() }: { range: RangeState } = $props();
</script>

<div class="flex items-center gap-2">
	<TerminalSelect bind:value={range.preset} options={dateRangeOptions} />
	{#if range.preset === 'custom'}
		<input
			type="date"
			bind:value={range.from}
			max={range.to || undefined}
			aria-label="From date"
			class="bg-surface border border-border-subtle rounded-lg px-2.5 py-[7px] text-xs font-mono text-text outline-none transition-colors focus:border-accent"
		/>
		<span class="text-text-muted font-mono text-xs">→</span>
		<input
			type="date"
			bind:value={range.to}
			min={range.from || undefined}
			aria-label="To date"
			class="bg-surface border border-border-subtle rounded-lg px-2.5 py-[7px] text-xs font-mono text-text outline-none transition-colors focus:border-accent"
		/>
	{/if}
</div>
