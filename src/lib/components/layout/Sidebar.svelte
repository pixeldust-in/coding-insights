<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';

	interface NavItem {
		label: string;
		href: string;
		icon: string;
	}

	const navItems: NavItem[] = [
		{ label: 'Dashboard', href: '/', icon: '◈' },
		{ label: 'Projects', href: '/projects', icon: '◫' },
		{ label: 'Commands', href: '/commands', icon: '⌘' },
		{ label: 'Skills', href: '/skills', icon: '✦' },
		{ label: 'Settings', href: '/settings', icon: '⚙' }
	];

	let collapsed = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="flex flex-col border-r border-border-subtle/60 bg-surface h-screen sticky top-0 transition-all duration-200 {collapsed ? 'w-16' : 'w-60'}"
>
	<div class="flex items-center gap-3 px-4 h-14 border-b border-border-subtle">
		{#if !collapsed}
			<div class="flex items-center gap-2.5">
				<span class="text-accent text-lg font-bold">✦</span>
				<span class="text-sm font-semibold tracking-tight">Claude Dashboard</span>
			</div>
		{:else}
			<span class="text-accent text-lg font-bold mx-auto">✦</span>
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
