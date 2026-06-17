<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import TerminalSearch from '$components/shared/TerminalSearch.svelte';
	import ProjectRow from '$components/shared/ProjectRow.svelte';

	let { data } = $props();

	let search = $state('');

	let filtered = $derived.by(() => {
		if (!search) return data.projects;
		const q = search.toLowerCase();
		return data.projects.filter(
			(p) =>
				p.displayName.toLowerCase().includes(q) ||
				p.decodedPath.toLowerCase().includes(q)
		);
	});

	let maxSessions = $derived(Math.max(1, ...data.projects.map((p) => p.sessionCount)));
</script>

<Header breadcrumbs={[{ label: 'Projects' }]} />

<div class="p-6 space-y-4">
	<!-- Search -->
	<div class="flex items-center gap-3">
		<TerminalSearch bind:value={search} placeholder="Search projects..." class="w-80" />
		<span class="text-xs font-mono text-text-muted ml-auto">
			{filtered.length} of {data.projects.length} projects
		</span>
	</div>

	{#if filtered.length > 0}
		<div class="border border-border-subtle rounded-xl overflow-hidden bg-surface card-elevated">
			{#each filtered as project}
				<ProjectRow
					href="/claude/projects/{encodeURIComponent(project.dirName)}"
					name={project.displayName}
					path={project.decodedPath}
					sessionCount={project.sessionCount}
					lastActive={project.lastActive}
					{maxSessions}
				/>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12 text-text-muted text-sm">
			No projects matching "{search}"
		</div>
	{/if}
</div>
