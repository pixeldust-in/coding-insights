<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import Badge from '$components/shared/Badge.svelte';
	import { formatDate } from '$utils/format.js';

	let { data } = $props();
	let activeTab = $state<'general' | 'permissions' | 'plugins'>('general');
</script>

<Header breadcrumbs={[{ label: 'Settings' }]} />

<div class="p-6 space-y-4">
	<!-- Tabs -->
	<div class="flex gap-1 border-b border-border-subtle">
		{#each [
			{ key: 'general', label: 'General' },
			{ key: 'permissions', label: 'Permissions' },
			{ key: 'plugins', label: 'Plugins' }
		] as tab}
			<button
				onclick={() => (activeTab = tab.key as typeof activeTab)}
				class="px-4 py-2 text-sm transition-colors cursor-pointer {activeTab === tab.key
					? 'text-accent border-b-2 border-accent'
					: 'text-text-muted hover:text-text-secondary'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- General Tab -->
	{#if activeTab === 'general'}
		<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated space-y-4">
			<h3 class="text-sm font-medium text-text-secondary">General Settings</h3>

			<div class="space-y-3">
				<div class="flex items-center justify-between py-2 border-b border-border-subtle/50">
					<span class="text-sm">Always Thinking</span>
					<Badge variant={data.settings.global.alwaysThinkingEnabled ? 'success' : 'default'}>
						{data.settings.global.alwaysThinkingEnabled ? 'Enabled' : 'Disabled'}
					</Badge>
				</div>

				<div class="flex items-center justify-between py-2 border-b border-border-subtle/50">
					<span class="text-sm">Skip Dangerous Mode Prompt</span>
					<Badge
						variant={data.settings.global.skipDangerousModePermissionPrompt
							? 'warning'
							: 'default'}
					>
						{data.settings.global.skipDangerousModePermissionPrompt ? 'Yes' : 'No'}
					</Badge>
				</div>

				{#if data.settings.global.enabledPlugins}
					<div class="py-2">
						<span class="text-sm text-text-secondary">Enabled Plugins</span>
						<div class="flex flex-wrap gap-2 mt-2">
							{#each Object.entries(data.settings.global.enabledPlugins) as [name, enabled]}
								<Badge variant={enabled ? 'accent' : 'default'}>
									{name.split('@')[0]}
								</Badge>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Permissions Tab -->
	{#if activeTab === 'permissions'}
		<div class="space-y-4">
			{#each [
				{ title: 'Ask (Global)', items: data.settings.global.permissions?.ask, variant: 'warning' as const },
				{ title: 'Allow (Local)', items: data.settings.local.permissions?.allow, variant: 'success' as const },
				{ title: 'Deny (Global)', items: data.settings.global.permissions?.deny, variant: 'error' as const },
				{ title: 'Deny (Local)', items: data.settings.local.permissions?.deny, variant: 'error' as const }
			] as section}
				{#if section.items && section.items.length > 0}
					<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
						<h3 class="text-sm font-medium text-text-secondary mb-3">{section.title}</h3>
						<div class="flex flex-wrap gap-2">
							{#each section.items as item}
								<Badge variant={section.variant}>
									<span class="font-mono text-xs">{item}</span>
								</Badge>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Plugins Tab -->
	{#if activeTab === 'plugins'}
		<div class="space-y-3">
			{#each data.plugins as plugin}
				<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="text-sm font-medium font-mono">{plugin.name}</h3>
							<div class="flex items-center gap-3 mt-2 text-xs text-text-muted">
								<span>v{plugin.version}</span>
								<span>Scope: {plugin.scope}</span>
								<span>Installed: {formatDate(plugin.installedAt)}</span>
							</div>
						</div>
						<Badge variant="accent">active</Badge>
					</div>
				</div>
			{/each}

			{#if data.plugins.length === 0}
				<div class="text-center py-8 text-text-muted text-sm">No plugins installed</div>
			{/if}
		</div>
	{/if}
</div>
