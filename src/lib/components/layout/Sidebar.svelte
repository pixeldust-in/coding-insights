<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import ClaudeLogo from '$components/shared/ClaudeLogo.svelte';

	interface NavItem {
		label: string;
		href: string;
		icon: string;
	}

	let { tool, navItems, title }: {
		tool: 'claude' | 'codex';
		navItems: NavItem[];
		title: string;
	} = $props();

	let collapsed = $state(false);

	function isActive(href: string): boolean {
		if (href === '/claude' || href === '/codex') return page.url.pathname === href;
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="flex flex-col border-r border-border-subtle/60 bg-surface h-screen sticky top-0 transition-all duration-200 {collapsed ? 'w-16' : 'w-60'}"
>
	<div class="flex items-center gap-3 px-4 h-14 border-b border-border-subtle">
		{#if !collapsed}
			<a href="/" class="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
				{#if tool === 'claude'}
					<span class="text-accent shrink-0"><ClaudeLogo size={22} /></span>
				{:else}
					<svg class="w-5 h-5 text-accent shrink-0" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073ZM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494ZM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646ZM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872v.024Zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667Zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66v.018ZM8.32 12.228l-2.023-1.168a.07.07 0 0 1-.038-.052V5.422a4.497 4.497 0 0 1 7.375-3.453l-.142.08L8.704 4.81a.795.795 0 0 0-.393.681l-.004 6.736h.013Zm1.1-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5-.005-2.999Z"/>
					</svg>
				{/if}
				<span class="text-sm font-semibold tracking-tight">{title}</span>
			</a>
		{:else}
			<a href="/" class="mx-auto hover:opacity-80 transition-opacity">
				{#if tool === 'claude'}
					<span class="text-accent"><ClaudeLogo size={22} /></span>
				{:else}
					<svg class="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073ZM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494ZM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646ZM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872v.024Zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667Zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66v.018ZM8.32 12.228l-2.023-1.168a.07.07 0 0 1-.038-.052V5.422a4.497 4.497 0 0 1 7.375-3.453l-.142.08L8.704 4.81a.795.795 0 0 0-.393.681l-.004 6.736h.013Zm1.1-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5-.005-2.999Z"/>
					</svg>
				{/if}
			</a>
		{/if}
	</div>

	<nav class="flex-1 py-2 px-2 space-y-0.5">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
					{isActive(item.href)
					? 'bg-accent/10 text-accent'
					: 'text-text-secondary hover:bg-surface-hover hover:text-text'}"
			>
				<span class="text-base shrink-0">{item.icon}</span>
				{#if !collapsed}
					<span>{item.label}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<div class="flex items-center gap-2 mx-2 mb-2">
		<ThemeToggle />
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex items-center justify-center flex-1 h-8 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors text-xs cursor-pointer"
		>
			{collapsed ? '→' : '← Collapse'}
		</button>
	</div>
</aside>
