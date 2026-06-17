<script lang="ts">
	let { sessionId }: { sessionId: string } = $props();

	let copied = $state(false);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(sessionId);
		} catch {
			const textarea = document.createElement('textarea');
			textarea.value = sessionId;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<button
	onclick={copyToClipboard}
	class="group inline-flex items-center gap-1.5 bg-surface-hover px-2 py-1 rounded-lg
		text-xs font-mono transition-colors cursor-pointer
		{copied ? 'text-success' : 'text-text-muted hover:text-text'}"
	title={copied ? 'Copied!' : 'Copy session ID'}
>
	<span class="opacity-70">ID</span>
	<span class="truncate max-w-[18rem]">{sessionId}</span>
	{#if copied}
		<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
	{/if}
</button>
