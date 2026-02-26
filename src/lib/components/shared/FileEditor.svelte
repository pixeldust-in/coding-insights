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
		<div class="flex items-center gap-1 flex-shrink-0">
			<button
				onclick={copyToClipboard}
				class="p-1.5 rounded-lg transition-colors cursor-pointer
					{copied
					? 'text-success'
					: 'text-text-muted hover:text-text hover:bg-surface-hover'}"
				disabled={!exists && savedContent === null && !editing}
				title={copied ? 'Copied!' : 'Copy to clipboard'}
			>
				{#if copied}
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
				{/if}
			</button>
			{#if editing}
				<button
					onclick={cancelEditing}
					class="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
					title="Cancel editing"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				</button>
				<button
					onclick={save}
					disabled={saving}
					class="p-1.5 rounded-lg text-accent hover:bg-accent/15 transition-colors cursor-pointer disabled:opacity-50"
					title={saving ? 'Saving...' : 'Save changes'}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
				</button>
			{:else}
				<button
					onclick={startEditing}
					class="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
					title="Edit file"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
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
