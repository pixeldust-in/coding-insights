<script lang="ts">
	interface Crumb {
		label: string;
		href?: string;
	}

	let { breadcrumbs = [], title = '' }: { breadcrumbs?: Crumb[]; title?: string } = $props();
</script>

<header class="flex items-center justify-between h-14 px-6 border-b border-border-subtle bg-bg">
	<div class="flex items-center gap-2 text-sm">
		{#each breadcrumbs as crumb, i}
			{#if i > 0}
				<span class="text-text-muted font-mono text-xs">/</span>
			{/if}
			{#if crumb.href}
				<a href={crumb.href} class="text-text-secondary hover:text-accent transition-colors">
					{crumb.label}
				</a>
			{:else}
				<span class="text-base text-text font-semibold">{crumb.label}</span>
			{/if}
		{/each}
		{#if breadcrumbs.length === 0 && title}
			<h1 class="text-base font-semibold">{title}</h1>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<kbd
			class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-text-muted font-mono bg-surface border border-border-subtle rounded-md"
		>
			⌘K
		</kbd>
	</div>
</header>
