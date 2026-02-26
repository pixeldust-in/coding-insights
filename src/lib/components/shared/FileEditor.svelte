<script lang="ts">
	import Badge from './Badge.svelte';

	let {
		filePath,
		displayName,
		description,
		content,
		exists,
		apiEndpoint
	}: {
		filePath: string;
		displayName: string;
		description: string;
		content: string;
		exists: boolean;
		apiEndpoint: string;
	} = $props();

	let editing = $state(false);
	let savedContent = $state<string | null>(null);
	let editContent = $state('');
	let saving = $state(false);
	let saveError = $state('');
	let saveSuccess = $state(false);
	let copied = $state(false);

	let currentContent = $derived(savedContent ?? content);

	function startEditing() {
		editContent = currentContent;
		editing = true;
		saveError = '';
		saveSuccess = false;
	}

	function cancelEditing() {
		editing = false;
		editContent = '';
		saveError = '';
	}

	async function save() {
		saving = true;
		saveError = '';
		saveSuccess = false;

		try {
			const res = await fetch(apiEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filePath, content: editContent })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to save');
			}

			savedContent = editContent;
			editing = false;
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 2000);
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Failed to save';
		} finally {
			saving = false;
		}
	}

	async function copyToClipboard() {
		const text = editing ? editContent : currentContent;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<div class="bg-surface border border-border-subtle rounded-xl overflow-hidden card-elevated">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-border-subtle/50">
		<div class="flex items-center gap-3 min-w-0">
			<span class="text-sm font-mono text-accent truncate">{displayName}</span>
			<Badge variant={exists || savedContent !== null ? 'success' : 'default'}>
				{exists || savedContent !== null ? 'exists' : 'not found'}
			</Badge>
			{#if saveSuccess}
				<Badge variant="success">saved</Badge>
			{/if}
		</div>
		<div class="flex items-center gap-2 flex-shrink-0">
			<button
				onclick={copyToClipboard}
				class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer
					{copied
					? 'bg-success/15 text-success'
					: 'bg-surface-hover text-text-secondary hover:text-text'}"
				disabled={!exists && savedContent === null && !editing}
			>
				{copied ? 'Copied!' : 'Copy'}
			</button>
			{#if editing}
				<button
					onclick={cancelEditing}
					class="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-hover text-text-secondary hover:text-text transition-colors cursor-pointer"
				>
					Cancel
				</button>
				<button
					onclick={save}
					disabled={saving}
					class="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors cursor-pointer disabled:opacity-50"
				>
					{saving ? 'Saving...' : 'Save'}
				</button>
			{:else}
				<button
					onclick={startEditing}
					class="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-hover text-text-secondary hover:text-text transition-colors cursor-pointer"
				>
					Edit
				</button>
			{/if}
		</div>
	</div>

	<!-- Description -->
	<div class="px-4 py-2 text-xs text-text-muted border-b border-border-subtle/30">
		{description}
		{#if exists || savedContent !== null}
			<span class="ml-2 font-mono opacity-60">({filePath})</span>
		{/if}
	</div>

	<!-- Content -->
	{#if editing}
		<div class="relative">
			<textarea
				bind:value={editContent}
				class="w-full min-h-[300px] p-4 bg-bg text-text font-mono text-xs leading-relaxed resize-y border-none outline-none"
				spellcheck="false"
			></textarea>
			{#if saveError}
				<div class="px-4 py-2 bg-error/10 text-error text-xs border-t border-error/20">
					{saveError}
				</div>
			{/if}
		</div>
	{:else if (exists || savedContent !== null) && currentContent}
		<pre
			class="p-4 bg-bg text-text font-mono text-xs leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto m-0"
		>{currentContent}</pre>
	{:else}
		<div class="flex flex-col items-center justify-center py-8 text-text-muted">
			<span class="text-2xl mb-2">~</span>
			<p class="text-xs">File does not exist yet. Click Edit to create it.</p>
		</div>
	{/if}
</div>
