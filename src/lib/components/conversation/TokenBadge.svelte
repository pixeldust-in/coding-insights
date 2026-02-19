<script lang="ts">
	import { formatTokens } from '$utils/format.js';

	let { input, output }: { input?: number; output?: number } = $props();
</script>

{#if (input && input > 0) || (output && output > 0)}
	<span class="inline-flex items-center gap-1 text-[10px] text-text-muted">
		{#if output && output > 0}
			<span class="tabular-nums">{formatTokens(output)} out</span>
		{/if}
	</span>
{/if}
