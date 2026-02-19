<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		defaultOpen = false,
		children
	}: {
		title: string;
		defaultOpen?: boolean;
		children: Snippet;
	} = $props();

	let open = $state(defaultOpen);
</script>

<div class="border border-border-subtle rounded-lg overflow-hidden">
	<button
		onclick={() => (open = !open)}
		class="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
	>
		<span class="transition-transform {open ? 'rotate-90' : ''}">▸</span>
		{title}
	</button>
	{#if open}
		<div class="px-3 pb-3">
			{@render children()}
		</div>
	{/if}
</div>
