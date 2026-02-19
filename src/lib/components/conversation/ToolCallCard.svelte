<script lang="ts">
	let {
		name,
		input,
		result
	}: {
		name: string;
		input: Record<string, unknown>;
		result?: string;
	} = $props();

	let open = $state(false);

	const toolColors: Record<string, string> = {
		Bash: 'text-success',
		Read: 'text-info',
		Write: 'text-warning',
		Edit: 'text-warning',
		Glob: 'text-info',
		Grep: 'text-info',
		Task: 'text-[#8B7EC8]',
		WebSearch: 'text-[#6A9FBF]',
		WebFetch: 'text-[#6A9FBF]'
	};

	function formatInput(inp: Record<string, unknown>): string {
		if (name === 'Bash' && inp.command) return String(inp.command).slice(0, 200);
		if (name === 'Read' && inp.file_path) return String(inp.file_path);
		if ((name === 'Write' || name === 'Edit') && inp.file_path) return String(inp.file_path);
		if (name === 'Glob' && inp.pattern) return String(inp.pattern);
		if (name === 'Grep' && inp.pattern) return String(inp.pattern);
		return JSON.stringify(inp, null, 2).slice(0, 500);
	}
</script>

<div class="border border-border-subtle rounded-lg overflow-hidden my-2">
	<button
		onclick={() => (open = !open)}
		class="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium hover:bg-surface-hover transition-colors cursor-pointer bg-surface"
	>
		<span class="transition-transform {open ? 'rotate-90' : ''} text-text-muted">▸</span>
		<span class="{toolColors[name] || 'text-text-secondary'} font-mono">{name}</span>
		<span class="text-text-muted truncate flex-1 text-left font-mono">
			{formatInput(input)}
		</span>
	</button>
	{#if open}
		<div class="px-3 py-2 space-y-2 bg-bg/50">
			<div>
				<p class="text-[10px] uppercase text-text-muted mb-1 tracking-wider font-mono">Input</p>
				<pre
					class="text-xs text-text-secondary font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{JSON.stringify(input, null, 2)}</pre>
			</div>
			{#if result}
				<div>
					<p class="text-[10px] uppercase text-text-muted mb-1 tracking-wider font-mono">Result</p>
					<pre
						class="text-xs text-text-secondary font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{result}</pre>
				</div>
			{/if}
		</div>
	{/if}
</div>
