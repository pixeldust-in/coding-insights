<script lang="ts">
	let { content }: { content: string } = $props();
	let open = $state(false);
</script>

<div class="border border-border-subtle rounded-lg overflow-hidden my-2">
	<button
		onclick={() => (open = !open)}
		class="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-hover transition-colors cursor-pointer bg-surface"
	>
		<span class="transition-transform {open ? 'rotate-90' : ''}">▸</span>
		<span class="text-warning/70">⟡</span> Thinking
		<span class="ml-auto text-[10px] text-text-muted font-mono">
			{content.length > 100 ? `${Math.ceil(content.length / 4)} words` : ''}
		</span>
	</button>
	{#if open}
		<div class="px-3 py-2 text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-bg/50">
			{content}
		</div>
	{/if}
</div>
