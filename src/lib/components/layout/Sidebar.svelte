<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import ClaudeLogo from '$components/shared/ClaudeLogo.svelte';

	interface NavLink {
		label: string;
		href: string;
		icon: string;
	}
	interface NavSection {
		section: string;
	}
	type NavEntry = NavLink | NavSection;

	let { tool, navItems, title }: {
		tool: 'claude' | 'codex';
		navItems: NavEntry[];
		title: string;
	} = $props();

	const subtitle = tool === 'codex' ? 'cli insights' : 'insights';
	const configPath = tool === 'codex' ? '~/.codex · synced' : '~/.claude · synced';

	let collapsed = $state(false);

	onMount(() => {
		collapsed = document.documentElement.classList.contains('sidebar-collapsed');
	});

	function toggleCollapsed() {
		collapsed = !collapsed;
		document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
		localStorage.setItem('sidebar-collapsed', String(collapsed));
	}

	function isActive(href: string): boolean {
		if (href === '/claude' || href === '/codex') return page.url.pathname === href;
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="flex flex-col border-r border-border-subtle/60 bg-surface h-screen sticky top-0 transition-all duration-200 {collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-60'}"
>
	<div class="flex items-center justify-between px-4 h-14 border-b border-border-subtle">
		<a href="/" class="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0">
			<span class="grid place-items-center w-8 h-8 rounded-lg shrink-0 shadow-[0_6px_18px_-6px_var(--color-accent-glow)]" style="background: radial-gradient(circle at 30% 30%, var(--color-accent-hover), var(--color-accent));">
				{#if tool === 'claude'}
					<span class="text-white"><ClaudeLogo size={18} /></span>
				{:else}
					<svg class="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 8l-3 4 3 4M19 8l3 4-3 4M14 5l-4 14"/>
					</svg>
				{/if}
			</span>
			<span class="flex flex-col min-w-0">
				<span class="text-sm font-bold tracking-tight whitespace-nowrap leading-none">{title}</span>
				<span class="text-[10px] font-mono text-text-muted mt-1 whitespace-nowrap">{subtitle}</span>
			</span>
		</a>
		<button
			onclick={toggleCollapsed}
			class="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
			title="Collapse sidebar"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="18" height="18" rx="2"/>
				<line x1="9" y1="3" x2="9" y2="21"/>
			</svg>
		</button>
	</div>

	<nav class="flex-1 py-3 px-3 space-y-0.5 overflow-hidden">
		{#each navItems as item}
			{#if 'section' in item}
				<div class="px-2.5 pt-4 pb-2 text-[10px] font-mono uppercase tracking-[0.12em] text-text-muted">
					{item.section}
				</div>
			{:else}
				<a
					href={item.href}
					class="relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-colors whitespace-nowrap
						{isActive(item.href)
						? 'bg-surface-hover text-text'
						: 'text-text-secondary hover:bg-surface-hover hover:text-text'}"
				>
					{#if isActive(item.href)}
						<span class="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r bg-accent"></span>
					{/if}
					<span class="text-base shrink-0 {isActive(item.href) ? 'text-accent' : ''}">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/if}
		{/each}
	</nav>

	<div class="flex items-center gap-2 px-3 py-3 mx-2 mb-1 border-t border-border-subtle">
		<span class="flex items-center gap-2 min-w-0 flex-1">
			<span class="w-[7px] h-[7px] rounded-full bg-success shadow-[0_0_8px_var(--color-success)] shrink-0"></span>
			<span class="text-[11px] font-mono text-text-secondary truncate">{configPath}</span>
		</span>
		<ThemeToggle />
	</div>
</aside>

{#if collapsed}
	<div class="shrink-0 flex items-start pt-3 pl-3">
		<button
			onclick={toggleCollapsed}
			class="flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border-subtle shadow-sm text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
			title="Open sidebar"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="18" height="18" rx="2"/>
				<line x1="9" y1="3" x2="9" y2="21"/>
			</svg>
		</button>
	</div>
{/if}
