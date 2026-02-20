<script lang="ts">
	import Header from '$components/layout/Header.svelte';

	let { data } = $props();
</script>

<Header breadcrumbs={[{ label: 'Skills' }]} />

<div class="p-6">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each data.skills as skill}
			<a
				href="/codex/skills/{skill.dirName}"
				class="bg-surface border border-border-subtle rounded-xl p-5 hover:border-accent/50 transition-all group card-elevated"
			>
				<h3 class="text-sm font-medium group-hover:text-accent transition-colors">
					{skill.name}
				</h3>
				{#if skill.description}
					<p class="text-xs text-text-secondary mt-2 line-clamp-3">{skill.description}</p>
				{/if}
				<div class="flex items-center gap-2 mt-3 text-xs text-text-muted">
					<span>{skill.subDocs.length} sub-documents</span>
				</div>
			</a>
		{/each}
	</div>

	{#if data.skills.length === 0}
		<div class="text-center py-12 text-text-muted text-sm">
			No skills found in ~/.codex/skills/
		</div>
	{/if}
</div>
