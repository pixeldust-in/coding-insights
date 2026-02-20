<script lang="ts">
	import ThemeToggle from '$components/layout/ThemeToggle.svelte';
	import ClaudeLogo from '$components/shared/ClaudeLogo.svelte';
	import OpenAILogo from '$components/shared/OpenAILogo.svelte';

	let { data } = $props();
</script>

<div class="min-h-screen bg-bg flex flex-col items-center justify-center relative">
	<!-- Theme Toggle -->
	<div class="absolute top-4 right-4">
		<ThemeToggle />
	</div>

	<!-- Content -->
	<div class="text-center mb-12">
		<h1 class="text-3xl font-bold tracking-tight text-text">Choose your poison</h1>
		<p class="text-text-muted text-sm mt-2">Select a tool to explore its usage data</p>
	</div>

	<div class="flex flex-col sm:flex-row gap-6">
		<!-- Claude Card -->
		<a
			href={data.claudeAvailable ? '/claude' : undefined}
			class="group bg-surface border border-border-subtle rounded-xl p-8 card-elevated w-72 text-center transition-all
				{data.claudeAvailable
					? 'hover:border-accent/50 cursor-pointer'
					: 'opacity-40 pointer-events-none'}"
		>
			<div class="flex justify-center mb-5 text-accent group-hover:scale-110 transition-transform">
				<ClaudeLogo size={56} />
			</div>
			<h2 class="text-lg font-semibold text-text">Claude Code</h2>
			<p class="text-xs text-text-muted mt-2">Anthropic's coding assistant</p>
			{#if !data.claudeAvailable}
				<p class="text-xs text-error mt-3">~/.claude/ not found</p>
			{:else}
				<div class="mt-4 flex items-center justify-center gap-1.5 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
					<span>Open dashboard</span>
					<span class="font-mono">-&gt;</span>
				</div>
			{/if}
		</a>

		<!-- Codex Card -->
		<a
			href={data.codexAvailable ? '/codex' : undefined}
			class="group bg-surface border border-border-subtle rounded-xl p-8 card-elevated w-72 text-center transition-all
				{data.codexAvailable
					? 'hover:border-accent/50 cursor-pointer'
					: 'opacity-40 pointer-events-none'}"
		>
			<div class="flex justify-center mb-5 text-accent group-hover:scale-110 transition-transform">
				<OpenAILogo size={56} />
			</div>
			<h2 class="text-lg font-semibold text-text">Codex CLI</h2>
			<p class="text-xs text-text-muted mt-2">OpenAI's coding agent</p>
			{#if !data.codexAvailable}
				<p class="text-xs text-error mt-3">~/.codex/ not found</p>
			{:else}
				<div class="mt-4 flex items-center justify-center gap-1.5 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
					<span>Open dashboard</span>
					<span class="font-mono">-&gt;</span>
				</div>
			{/if}
		</a>
	</div>

	<!-- Footer -->
	<p class="text-[10px] text-text-muted mt-16 font-mono">Coding Insights &middot; read-only dashboard</p>
</div>
