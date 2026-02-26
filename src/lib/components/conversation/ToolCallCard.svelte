<script lang="ts">
	import DiffView from './DiffView.svelte';

	let {
		name,
		input,
		result,
		expandDiffs = false
	}: {
		name: string;
		input: Record<string, unknown>;
		result?: string;
		expandDiffs?: boolean;
	} = $props();

	let manualToggle = $state<boolean | null>(null);

	const isDiffTool = $derived(
		((name === 'Edit' || name === 'Write') && typeof input.file_path === 'string') ||
		(name === 'apply_patch' && typeof input.patch === 'string')
	);

	const open = $derived(manualToggle !== null ? manualToggle : (isDiffTool && expandDiffs));

	const toolColors: Record<string, string> = {
		Bash: 'text-success',
		Read: 'text-info',
		Write: 'text-warning',
		Edit: 'text-warning',
		apply_patch: 'text-warning',
		exec_command: 'text-success',
		Glob: 'text-info',
		Grep: 'text-info',
		Task: 'text-[#8B7EC8]',
		WebSearch: 'text-[#6A9FBF]',
		WebFetch: 'text-[#6A9FBF]'
	};

	function formatInput(inp: Record<string, unknown>): string {
		if (name === 'Bash' && inp.command) return String(inp.command).slice(0, 200);
		if (name === 'exec_command' && inp.raw) return String(inp.raw).slice(0, 200);
		if (name === 'Read' && inp.file_path) return String(inp.file_path);
		if ((name === 'Write' || name === 'Edit') && inp.file_path) return String(inp.file_path);
		if (name === 'apply_patch' && inp.patch) {
			const patch = String(inp.patch);
			const fileMatch = patch.match(/\*\*\* (?:Update|Add|Delete) File:\s*(\S+)/);
			return fileMatch ? fileMatch[1] : 'patch';
		}
		if (name === 'Glob' && inp.pattern) return String(inp.pattern);
		if (name === 'Grep' && inp.pattern) return String(inp.pattern);
		return JSON.stringify(inp, null, 2).slice(0, 500);
	}

	const diffToolName = $derived<'Edit' | 'Write' | 'apply_patch'>(
		name === 'apply_patch' ? 'apply_patch' : name as 'Edit' | 'Write'
	);
</script>

<div class="border border-border-subtle rounded-lg overflow-hidden my-2">
	<button
		onclick={() => (manualToggle = !open)}
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
			{#if isDiffTool}
				<DiffView toolName={diffToolName} {input} />
			{:else}
				<div>
					<p class="text-[10px] uppercase text-text-muted mb-1 tracking-wider font-mono">Input</p>
					<pre
						class="text-xs text-text-secondary font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{JSON.stringify(input, null, 2)}</pre>
				</div>
			{/if}
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
