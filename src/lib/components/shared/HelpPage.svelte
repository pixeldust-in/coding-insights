<script lang="ts">
	import type { CliHelpData } from '$lib/server/types.js';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import EmptyState from '$components/shared/EmptyState.svelte';

	let { helpData }: { helpData: CliHelpData } = $props();

	let search = $state('');
	let activeTab = $state<'commands' | 'subcommands' | 'options'>('commands');

	let filteredSlashCommands = $derived(
		helpData.slashCommands.filter((cmd) => {
			if (!search) return true;
			const q = search.toLowerCase();
			return cmd.name.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q);
		})
	);

	let filteredSubcommands = $derived(
		helpData.subcommands.filter((cmd) => {
			if (!search) return true;
			const q = search.toLowerCase();
			return cmd.name.toLowerCase().includes(q) || cmd.summary.toLowerCase().includes(q);
		})
	);

	let filteredOptions = $derived(
		helpData.options.filter((opt) => {
			if (!search) return true;
			const q = search.toLowerCase();
			return (
				opt.long.toLowerCase().includes(q) ||
				(opt.short?.toLowerCase().includes(q) ?? false) ||
				opt.description.toLowerCase().includes(q) ||
				(opt.argument?.toLowerCase().includes(q) ?? false)
			);
		})
	);
</script>

{#if helpData.error}
	<div class="space-y-4">
		<div class="bg-surface border border-border-subtle rounded-xl p-8 card-elevated text-center">
			<span class="text-3xl block mb-3">⚠</span>
			<p class="text-text-secondary text-sm">{helpData.error}</p>
		</div>

		<!-- Still show slash commands even if CLI not found -->
		{#if helpData.slashCommands.length > 0}
			<h3 class="text-sm font-medium text-text-secondary">Slash Commands ({helpData.slashCommands.length})</h3>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
				{#each helpData.slashCommands as cmd}
					<div class="bg-surface border border-border-subtle rounded-xl p-4 card-elevated">
						<div class="flex items-baseline gap-2">
							<span class="font-mono text-sm text-accent">/{cmd.name}</span>
							{#if cmd.argument}
								<span class="font-mono text-xs text-text-muted">{cmd.argument}</span>
							{/if}
						</div>
						<p class="text-xs text-text-secondary mt-1">{cmd.description}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div class="space-y-4">
		<TerminalSearch bind:value={search} placeholder="Search commands and options..." />

		<!-- Usage -->
		{#if helpData.usage && !search}
			<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
				<pre class="font-mono text-sm text-accent bg-bg rounded-lg p-3 overflow-x-auto">{helpData.usage}</pre>
				{#if helpData.description}
					<p class="text-sm text-text-secondary mt-3">{helpData.description}</p>
				{/if}
			</div>
		{/if}

		<!-- Tabs -->
		<div class="flex gap-1 border-b border-border-subtle">
			<button
				onclick={() => (activeTab = 'commands')}
				class="px-4 py-2 text-sm transition-colors cursor-pointer {activeTab === 'commands'
					? 'text-accent border-b-2 border-accent'
					: 'text-text-muted hover:text-text-secondary'}"
			>
				Slash Commands ({filteredSlashCommands.length})
			</button>
			<button
				onclick={() => (activeTab = 'subcommands')}
				class="px-4 py-2 text-sm transition-colors cursor-pointer {activeTab === 'subcommands'
					? 'text-accent border-b-2 border-accent'
					: 'text-text-muted hover:text-text-secondary'}"
			>
				Subcommands ({filteredSubcommands.length})
			</button>
			<button
				onclick={() => (activeTab = 'options')}
				class="px-4 py-2 text-sm transition-colors cursor-pointer {activeTab === 'options'
					? 'text-accent border-b-2 border-accent'
					: 'text-text-muted hover:text-text-secondary'}"
			>
				Flags & Options ({filteredOptions.length})
			</button>
		</div>

		<!-- Slash Commands Tab -->
		{#if activeTab === 'commands'}
			{#if filteredSlashCommands.length === 0}
				<EmptyState message="No commands match your search" />
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
					{#each filteredSlashCommands as cmd}
						<div class="bg-surface border border-border-subtle rounded-xl p-4 card-elevated">
							<div class="flex items-baseline gap-2">
								<span class="font-mono text-sm text-accent">/{cmd.name}</span>
								{#if cmd.argument}
									<span class="font-mono text-xs text-text-muted">{cmd.argument}</span>
								{/if}
							</div>
							<p class="text-xs text-text-secondary mt-1">{cmd.description}</p>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Subcommands Tab -->
		{#if activeTab === 'subcommands'}
			{#if filteredSubcommands.length === 0}
				<EmptyState message="No subcommands match your search" />
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
					{#each filteredSubcommands as cmd}
						<div class="bg-surface border border-border-subtle rounded-xl p-4 card-elevated">
							<span class="font-mono text-sm text-accent">{helpData.tool} {cmd.name}</span>
							<p class="text-xs text-text-secondary mt-1">{cmd.summary}</p>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Options Tab -->
		{#if activeTab === 'options'}
			{#if filteredOptions.length === 0}
				<EmptyState message="No options match your search" />
			{:else}
				<div class="bg-surface border border-border-subtle rounded-xl card-elevated divide-y divide-border-subtle/50">
					{#each filteredOptions as opt}
						<div class="px-5 py-3">
							<div class="flex items-baseline gap-2 flex-wrap">
								{#if opt.short}
									<span class="font-mono text-sm text-accent">{opt.short},</span>
								{/if}
								<span class="font-mono text-sm text-accent">{opt.long}</span>
								{#if opt.argument}
									<span class="font-mono text-xs text-text-muted">{opt.argument}</span>
								{/if}
							</div>
							<p class="text-xs text-text-secondary mt-1">{opt.description}</p>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}
