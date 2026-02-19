<script lang="ts">
	import { formatDateTime } from '$utils/format.js';
	import type { ContentBlock } from '$lib/server/types.js';

	let { content, timestamp }: { content: string | ContentBlock[]; timestamp: string } = $props();

	function getTextContent(c: string | ContentBlock[]): string {
		if (typeof c === 'string') return c;
		return c
			.filter((b): b is { type: 'text'; text: string } => b.type === 'text')
			.map((b) => b.text)
			.join('\n');
	}
</script>

<div class="flex gap-3">
	<div
		class="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-xs text-text-muted shrink-0 mt-0.5 font-mono"
	>
		U
	</div>
	<div class="flex-1 min-w-0">
		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs font-medium text-text-secondary">You</span>
			<span class="text-[10px] text-text-muted font-mono">{formatDateTime(timestamp)}</span>
		</div>
		<div class="text-sm text-text whitespace-pre-wrap break-words">
			{getTextContent(content)}
		</div>
	</div>
</div>
