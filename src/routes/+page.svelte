<script lang="ts">
	import ThemeToggle from '$components/layout/ThemeToggle.svelte';
	import ClaudeLogo from '$components/shared/ClaudeLogo.svelte';
	import OpenAILogo from '$components/shared/OpenAILogo.svelte';

	let { data } = $props();
</script>

<div class="min-h-screen bg-bg flex flex-col items-center justify-center relative" data-page="home">
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
			class="tool-card tool-card--claude group relative overflow-hidden bg-surface border border-border-subtle rounded-xl p-8 w-72 text-center transition-all
				{data.claudeAvailable
					? 'cursor-pointer'
					: 'opacity-40 pointer-events-none'}"
		>
			<div class="relative z-10">
				<div class="flex justify-center mb-5 group-hover:scale-110 transition-transform">
					<span class="text-text-muted group-hover:text-[#DA7756] transition-colors">
						<ClaudeLogo size={56} />
					</span>
				</div>
				<h2 class="text-lg font-semibold text-text">Claude Code</h2>
				<p class="text-xs text-text-muted mt-2">Anthropic's coding assistant</p>
				{#if !data.claudeAvailable}
					<p class="text-xs text-error mt-3">~/.claude/ not found</p>
				{:else}
					<div class="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted group-hover:text-[#DA7756] opacity-0 group-hover:opacity-100 transition-all">
						<span>Open dashboard</span>
						<span class="font-mono">-&gt;</span>
					</div>
				{/if}
			</div>
		</a>

		<!-- Codex Card -->
		<a
			href={data.codexAvailable ? '/codex' : undefined}
			class="tool-card tool-card--codex group relative overflow-hidden bg-surface border border-border-subtle rounded-xl p-8 w-72 text-center transition-all
				{data.codexAvailable
					? 'cursor-pointer'
					: 'opacity-40 pointer-events-none'}"
		>
			<div class="relative z-10">
				<div class="flex justify-center mb-5 group-hover:scale-110 transition-transform">
					<span class="text-text-muted group-hover:text-[#10A37F] transition-colors">
						<OpenAILogo size={56} />
					</span>
				</div>
				<h2 class="text-lg font-semibold text-text">Codex CLI</h2>
				<p class="text-xs text-text-muted mt-2">OpenAI's coding agent</p>
				{#if !data.codexAvailable}
					<p class="text-xs text-error mt-3">~/.codex/ not found</p>
				{:else}
					<div class="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted group-hover:text-[#10A37F] opacity-0 group-hover:opacity-100 transition-all">
						<span>Open dashboard</span>
						<span class="font-mono">-&gt;</span>
					</div>
				{/if}
			</div>
		</a>
	</div>

	<!-- Footer -->
	<p class="text-[10px] text-text-muted mt-16 font-mono">Coding Insights &middot; read-only dashboard</p>
</div>

<style>
	.tool-card {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.tool-card::before {
		content: '';
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 0;
		border-radius: inherit;
	}

	.tool-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.tool-card--claude::before {
		background: linear-gradient(135deg, rgba(218, 119, 86, 0.08) 0%, rgba(218, 119, 86, 0.15) 100%);
	}

	.tool-card--claude:hover::before {
		opacity: 1;
	}

	.tool-card--claude:hover {
		border-color: rgba(218, 119, 86, 0.3);
	}

	.tool-card--codex::before {
		background: linear-gradient(135deg, rgba(16, 163, 127, 0.08) 0%, rgba(16, 163, 127, 0.15) 100%);
	}

	.tool-card--codex:hover::before {
		opacity: 1;
	}

	.tool-card--codex:hover {
		border-color: rgba(16, 163, 127, 0.3);
	}

	:global(html.light) .tool-card:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	:global(html.light) .tool-card--claude::before {
		background: linear-gradient(135deg, rgba(218, 119, 86, 0.06) 0%, rgba(218, 119, 86, 0.12) 100%);
	}

	:global(html.light) .tool-card--codex::before {
		background: linear-gradient(135deg, rgba(16, 163, 127, 0.06) 0%, rgba(16, 163, 127, 0.12) 100%);
	}
</style>
