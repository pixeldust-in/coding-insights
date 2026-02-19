<script lang="ts">
	import Header from '$components/layout/Header.svelte';

	let { data } = $props();
	let activeTab = $state('overview');
</script>

<Header
	breadcrumbs={[{ label: 'Skills', href: '/skills' }, { label: data.skill.name }]}
/>

<div class="p-6 space-y-4">
	<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
		<h2 class="text-lg font-semibold">{data.skill.name}</h2>
		{#if data.skill.description}
			<p class="text-sm text-text-secondary mt-1">{data.skill.description}</p>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 border-b border-border-subtle">
		<button
			onclick={() => (activeTab = 'overview')}
			class="px-4 py-2 text-sm transition-colors cursor-pointer {activeTab === 'overview'
				? 'text-accent border-b-2 border-accent'
				: 'text-text-muted hover:text-text-secondary'}"
		>
			Overview
		</button>
		{#each data.skill.subDocs as doc}
			<button
				onclick={() => (activeTab = doc.name)}
				class="px-4 py-2 text-sm transition-colors cursor-pointer {activeTab === doc.name
					? 'text-accent border-b-2 border-accent'
					: 'text-text-muted hover:text-text-secondary'}"
			>
				{doc.name}
			</button>
		{/each}
	</div>

	<!-- Tab Content -->
	<div class="bg-surface border border-border-subtle rounded-xl p-6">
		{#if activeTab === 'overview'}
			<div class="prose text-sm">
				{@html data.skill.renderedHtml}
			</div>
		{:else}
			{#each data.skill.subDocs as doc}
				{#if activeTab === doc.name}
					<div class="prose text-sm">
						{@html doc.renderedHtml}
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</div>
