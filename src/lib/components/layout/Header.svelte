<script lang="ts">
	interface Crumb {
		label: string;
		href?: string;
	}

	let { breadcrumbs = [], title = '' }: { breadcrumbs?: Crumb[]; title?: string } = $props();

	function openSearch() {
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
	}
</script>

<header
	class="sticky top-0 z-10 flex items-center gap-4 h-14 px-6 border-b border-border-subtle bg-bg/75 backdrop-blur-md"
>
	<div class="flex items-center gap-1.5 font-mono text-[13px] min-w-0">
		{#each breadcrumbs as crumb, i}
			{#if i > 0}
				<span class="text-text-muted px-0.5">/</span>
			{/if}
			{#if crumb.href}
				<a href={crumb.href} class="text-text-secondary hover:text-accent transition-colors truncate">
					{crumb.label}
				</a>
			{:else}
				<span class="text-text font-semibold truncate">{crumb.label}</span>
			{/if}
		{/each}
		{#if breadcrumbs.length === 0 && title}
			<span class="text-text font-semibold lowercase">{title}</span>
		{/if}
	</div>

	<button
		type="button"
		onclick={openSearch}
		class="ml-auto hidden sm:flex items-center gap-2 w-64 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-muted hover:border-accent/40 hover:text-text-secondary transition-colors cursor-pointer"
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>
		<span class="font-mono text-[13px] flex-1 text-left">Search everything…</span>
		<kbd class="font-mono text-[10px] px-1.5 py-px border border-border rounded">⌘K</kbd>
	</button>
</header>
