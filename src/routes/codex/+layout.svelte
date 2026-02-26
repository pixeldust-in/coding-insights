<script lang="ts">
	import Sidebar from '$components/layout/Sidebar.svelte';

	let { children } = $props();

	const navItems = [
		{ label: 'Dashboard', href: '/codex', icon: '◆' },
		{ label: 'Projects', href: '/codex/projects', icon: '▣' },
		{ label: 'Sessions', href: '/codex/sessions', icon: '◈' },
		{ label: 'History', href: '/codex/history', icon: '↻' },
		{ label: 'Plans', href: '/codex/plans', icon: '▤' },
		{ label: 'Skills', href: '/codex/skills', icon: '✦' },
		{ label: 'Commands', href: '/codex/commands', icon: '⌘' },
		{ label: 'Help', href: '/codex/help', icon: '?' },
		{ label: 'Settings', href: '/codex/settings', icon: '⚙' }
	];
</script>

<div class="flex min-h-screen bg-bg" data-tool="codex">
	<Sidebar tool="codex" {navItems} title="Codex CLI" />
	<main class="flex-1 min-w-0 overflow-auto">
		{@render children()}
	</main>
</div>
