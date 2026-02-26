<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import Badge from '$components/shared/Badge.svelte';
	import FileEditor from '$components/shared/FileEditor.svelte';

	let { data } = $props();
	let activeTab = $state<'general' | 'projects' | 'mcp' | 'files'>('general');

	let projects = $derived(
		data.config.projects
			? Object.entries(data.config.projects).map(([path, info]) => ({
					path,
					trustLevel: (info as { trust_level: string }).trust_level
				}))
			: []
	);

	let mcpServers = $derived(
		data.config.mcp_servers
			? Object.entries(data.config.mcp_servers).map(([name, info]) => ({
					name,
					...(info as { command: string; args?: string[] })
				}))
			: []
	);
</script>

<Header breadcrumbs={[{ label: 'Settings' }]} />

<div class="p-6 space-y-4">
	<!-- Tabs -->
	<div class="flex gap-1 border-b border-border-subtle">
		{#each [
			{ key: 'general', label: 'General' },
			{ key: 'projects', label: 'Project Trust' },
			{ key: 'mcp', label: 'MCP Servers' },
			{ key: 'files', label: 'Files' }
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
			<h3 class="text-sm font-medium text-text-secondary">General Configuration</h3>

			<div class="space-y-3">
				<div class="flex items-center justify-between py-2 border-b border-border-subtle/50">
					<span class="text-sm">Model</span>
					<Badge variant="accent">{data.config.model || 'default'}</Badge>
				</div>

				<div class="flex items-center justify-between py-2 border-b border-border-subtle/50">
					<span class="text-sm">Reasoning Effort</span>
					<Badge>{data.config.model_reasoning_effort || 'medium'}</Badge>
				</div>

				<div class="flex items-center justify-between py-2 border-b border-border-subtle/50">
					<span class="text-sm">Personality</span>
					<Badge>{data.config.personality || 'default'}</Badge>
				</div>
			</div>
		</div>
	{/if}

	<!-- Projects Tab -->
	{#if activeTab === 'projects'}
		<div class="space-y-2">
			{#each projects as project}
				<div class="bg-surface border border-border-subtle rounded-xl p-4 card-elevated">
					<div class="flex items-center justify-between">
						<span class="text-sm font-mono truncate mr-4">{project.path}</span>
						<Badge variant={project.trustLevel === 'trusted' ? 'success' : 'warning'}>
							{project.trustLevel}
						</Badge>
					</div>
				</div>
			{/each}

			{#if projects.length === 0}
				<div class="text-center py-8 text-text-muted text-sm">No project trust entries</div>
			{/if}
		</div>
	{/if}

	<!-- MCP Servers Tab -->
	{#if activeTab === 'mcp'}
		<div class="space-y-3">
			{#each mcpServers as server}
				<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="text-sm font-medium font-mono">{server.name}</h3>
							<div class="flex items-center gap-3 mt-2 text-xs text-text-muted">
								<span>Command: <code class="text-accent">{server.command}</code></span>
								{#if server.args && server.args.length > 0}
									<span>Args: <code class="text-accent">{server.args.join(' ')}</code></span>
								{/if}
							</div>
						</div>
						<Badge variant="accent">active</Badge>
					</div>
				</div>
			{/each}

			{#if mcpServers.length === 0}
				<div class="text-center py-8 text-text-muted text-sm">No MCP servers configured</div>
			{/if}
		</div>
	{/if}

	<!-- Files Tab -->
	{#if activeTab === 'files'}
		<div class="space-y-4">
			<p class="text-xs text-text-muted">
				View and edit your Codex CLI configuration files. Changes are written directly to disk.
			</p>
			{#each data.configFiles as file}
				<FileEditor
					filePath={file.filePath}
					displayName={file.displayName}
					description={file.description}
					content={file.content}
					exists={file.exists}
					apiEndpoint="/api/codex/files"
				/>
			{/each}
		</div>
	{/if}
</div>
