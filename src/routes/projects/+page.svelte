<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import { relativeTime } from '$utils/format.js';

	let { data } = $props();

	let search = $state('');

	let filtered = $derived(() => {
		if (!search) return data.projects;
		const q = search.toLowerCase();
		return data.projects.filter(
			(p) =>
				p.displayName.toLowerCase().includes(q) ||
				p.decodedPath.toLowerCase().includes(q)
		);
	});
</script>

<Header breadcrumbs={[{ label: 'Projects' }]} />

<div class="p-6 space-y-4">
	<!-- Search -->
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search projects..." class="w-80" />
		<span class="text-xs text-text-muted ml-auto">
			{filtered().length} of {data.projects.length} projects
		</span>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each filtered() as project}
			<a
				href="/projects/{encodeURIComponent(project.dirName)}"
				class="bg-surface border border-border-subtle rounded-xl p-5 hover:border-accent/50 transition-all group card-elevated"
			>
				<div class="flex items-start justify-between">
					<div class="min-w-0 flex-1">
						<h3 class="text-sm font-medium truncate group-hover:text-accent transition-colors">
							{project.displayName}
						</h3>
						<p class="text-xs text-text-muted mt-1 truncate font-mono">
							{project.decodedPath}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-4 mt-4 text-xs text-text-muted">
					<span>{project.sessionCount} sessions</span>
					{#if project.lastActive}
						<span>Active {relativeTime(project.lastActive)}</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>

	{#if search && filtered().length === 0}
		<div class="text-center py-12 text-text-muted text-sm">
			No projects matching "{search}"
		</div>
	{/if}
</div>
