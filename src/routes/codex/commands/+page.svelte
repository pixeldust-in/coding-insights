<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import Badge from '$components/shared/Badge.svelte';

	let { data } = $props();
	let expanded = $state<string | null>(null);
</script>

<Header breadcrumbs={[{ label: 'Commands' }]} />

<div class="p-6">
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		{#each data.commands as cmd}
			<div class="bg-surface border border-border-subtle rounded-xl overflow-hidden card-elevated">
				<button
					onclick={() => (expanded = expanded === cmd.name ? null : cmd.name)}
					class="w-full p-5 text-left hover:bg-surface-hover/50 transition-colors cursor-pointer"
				>
					<div class="flex items-start justify-between">
						<div>
							<h3 class="text-sm font-medium font-mono text-accent">/{cmd.name}</h3>
							{#if cmd.description}
								<p class="text-xs text-text-secondary mt-1">{cmd.description}</p>
							{/if}
						</div>
						<span
							class="text-text-muted transition-transform text-xs {expanded === cmd.name
								? 'rotate-90'
								: ''}"
						>
							▸
						</span>
					</div>
					{#if cmd.allowedTools}
						<div class="flex flex-wrap gap-1.5 mt-3">
							{#each cmd.allowedTools.split('),').map((t) => t.trim().replace(/\)$/, '') + ')') as tool}
								<Badge>{tool}</Badge>
							{/each}
						</div>
					{/if}
				</button>

				{#if expanded === cmd.name}
					<div class="border-t border-border-subtle px-5 py-4">
						<div class="prose text-sm">
							{@html cmd.renderedHtml}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
