<script lang="ts">
	import { diffLines } from 'diff';
	import { getLanguageFromPath, getShortFilename } from '$utils/languages';

	let {
		toolName,
		input
	}: {
		toolName: 'Edit' | 'Write' | 'apply_patch';
		input: Record<string, unknown>;
	} = $props();

	interface DiffLine {
		type: 'added' | 'removed' | 'context';
		content: string;
		oldLine: number | null;
		newLine: number | null;
	}

	function parsePatch(patch: string): { filePath: string; lines: DiffLine[]; addCount: number; removeCount: number } {
		const lines: DiffLine[] = [];
		let addCount = 0;
		let removeCount = 0;
		let filePath = '';

		// Extract file path from *** Update/Add/Delete File: <path>
		const fileMatch = patch.match(/\*\*\* (?:Update|Add|Delete) File:\s*(\S+)/);
		if (fileMatch) filePath = fileMatch[1];

		const isAddFile = patch.includes('*** Add File:');

		// Find content after @@ marker
		const atIdx = patch.indexOf('@@');
		if (atIdx === -1) return { filePath, lines, addCount, removeCount };

		const body = patch.slice(atIdx + 2).replace(/\*\*\* End Patch\s*$/, '');
		const patchLines = body.split('\n');

		let oldLine = 1;
		let newLine = 1;

		for (const raw of patchLines) {
			// Skip empty leading/trailing lines from split
			if (raw === '' && patchLines.indexOf(raw) === 0) continue;

			if (raw.startsWith('+')) {
				lines.push({ type: 'added', content: raw.slice(1), oldLine: null, newLine });
				newLine++;
				addCount++;
			} else if (raw.startsWith('-')) {
				lines.push({ type: 'removed', content: raw.slice(1), oldLine, newLine: null });
				oldLine++;
				removeCount++;
			} else if (raw.startsWith(' ') || raw === '') {
				// Context line (prefixed with space) or blank line
				const content = raw.startsWith(' ') ? raw.slice(1) : raw;
				if (isAddFile) {
					// In Add File mode, all non-prefixed lines shouldn't appear,
					// but handle gracefully
					lines.push({ type: 'added', content, oldLine: null, newLine });
					newLine++;
					addCount++;
				} else {
					lines.push({ type: 'context', content, oldLine, newLine });
					oldLine++;
					newLine++;
				}
			}
		}

		return { filePath, lines, addCount, removeCount };
	}

	const filePath = $derived(
		toolName === 'apply_patch'
			? (parsePatch(String(input.patch || '')).filePath)
			: String(input.file_path || '')
	);
	const shortName = $derived(getShortFilename(filePath));
	const language = $derived(getLanguageFromPath(filePath));

	const diffResult = $derived.by(() => {
		const lines: DiffLine[] = [];
		let addCount = 0;
		let removeCount = 0;

		if (toolName === 'apply_patch') {
			const result = parsePatch(String(input.patch || ''));
			return { lines: result.lines, addCount: result.addCount, removeCount: result.removeCount };
		} else if (toolName === 'Edit') {
			const oldStr = String(input.old_string || '');
			const newStr = String(input.new_string || '');
			const changes = diffLines(oldStr, newStr);

			let oldLine = 1;
			let newLine = 1;

			for (const change of changes) {
				const changeLines = change.value.replace(/\n$/, '').split('\n');
				for (const line of changeLines) {
					if (change.added) {
						lines.push({ type: 'added', content: line, oldLine: null, newLine });
						newLine++;
						addCount++;
					} else if (change.removed) {
						lines.push({ type: 'removed', content: line, oldLine, newLine: null });
						oldLine++;
						removeCount++;
					} else {
						lines.push({ type: 'context', content: line, oldLine, newLine });
						oldLine++;
						newLine++;
					}
				}
			}
		} else {
			// Write tool — all lines are additions (new file)
			const content = String(input.content || '');
			const contentLines = content.split('\n');
			for (let i = 0; i < contentLines.length; i++) {
				lines.push({ type: 'added', content: contentLines[i], oldLine: null, newLine: i + 1 });
				addCount++;
			}
		}

		return { lines, addCount, removeCount };
	});

	const TRUNCATE_THRESHOLD = 100;
	const TRUNCATE_SHOW = 50;

	let showAll = $state(false);

	const visibleLines = $derived(
		diffResult.lines.length > TRUNCATE_THRESHOLD && !showAll
			? diffResult.lines.slice(0, TRUNCATE_SHOW)
			: diffResult.lines
	);

	const isTruncated = $derived(diffResult.lines.length > TRUNCATE_THRESHOLD && !showAll);
</script>

<div class="border border-border-subtle rounded-lg overflow-hidden font-mono text-xs">
	<!-- Header -->
	<div class="flex items-center gap-2 px-3 py-1.5 bg-surface border-b border-border-subtle">
		<span class="text-text-secondary truncate" title={filePath}>{shortName}</span>
		<span class="px-1.5 py-0.5 rounded text-[10px] bg-surface-hover text-text-muted">{language}</span>
		<span class="ml-auto flex gap-2 text-[11px]">
			{#if diffResult.addCount > 0}
				<span class="diff-marker-add font-semibold">+{diffResult.addCount}</span>
			{/if}
			{#if diffResult.removeCount > 0}
				<span class="diff-marker-remove font-semibold">-{diffResult.removeCount}</span>
			{/if}
		</span>
	</div>

	<!-- Diff table -->
	<div class="max-h-96 overflow-y-auto">
		<table class="w-full border-collapse">
			<tbody>
				{#each visibleLines as line}
					<tr class="diff-line {line.type === 'added' ? 'diff-line-added' : line.type === 'removed' ? 'diff-line-removed' : ''}">
						<td class="diff-gutter w-[1px] px-2 py-0 text-right text-[11px] whitespace-nowrap select-none">
							{line.oldLine ?? ''}
						</td>
						<td class="diff-gutter w-[1px] px-2 py-0 text-right text-[11px] whitespace-nowrap select-none">
							{line.newLine ?? ''}
						</td>
						<td class="w-[1px] px-1 py-0 text-center select-none {line.type === 'added' ? 'diff-marker-add' : line.type === 'removed' ? 'diff-marker-remove' : 'text-transparent'}">
							{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
						</td>
						<td class="px-2 py-0 whitespace-pre-wrap break-all">{line.content}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if isTruncated}
			<button
				onclick={() => (showAll = true)}
				class="w-full py-2 text-center text-xs text-accent hover:text-accent-hover bg-surface hover:bg-surface-hover border-t border-border-subtle cursor-pointer transition-colors"
			>
				Show all {diffResult.lines.length} lines
			</button>
		{/if}
	</div>
</div>
