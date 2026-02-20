<script lang="ts">
	import Sidebar from '$components/layout/Sidebar.svelte';

	let { children } = $props();

	const navItems = [
		{ label: 'Dashboard', href: '/claude', icon: '◈' },
		{ label: 'Sessions', href: '/claude/sessions', icon: '◇' },
		{ label: 'Projects', href: '/claude/projects', icon: '◫' },
		{ label: 'Commands', href: '/claude/commands', icon: '⌘' },
		{ label: 'Skills', href: '/claude/skills', icon: '✦' },
		{ label: 'Settings', href: '/claude/settings', icon: '⚙' }
	];
</script>

<div class="flex min-h-screen bg-bg" data-tool="claude">
	<Sidebar tool="claude" {navItems} title="Claude Code" />
	<main class="flex-1 min-w-0 overflow-auto">
		{@render children()}
	</main>
</div>
