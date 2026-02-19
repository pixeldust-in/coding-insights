<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' }: { children: Snippet; class?: string } = $props();
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 {className}">
	{@render children()}
</div>
