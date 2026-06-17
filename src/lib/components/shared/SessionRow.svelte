<script lang="ts">
	import { relativeTime, formatDuration } from '$utils/format.js';
	import { entityColor } from '$utils/entity-color.js';

	let {
		href,
		prompt,
		projectName = '',
		messageCount = undefined,
		durationMinutes = undefined,
		model = '',
		outcome = undefined,
		time = ''
	}: {
		href: string;
		prompt: string;
		projectName?: string;
		messageCount?: number;
		durationMinutes?: number;
		model?: string;
		outcome?: 'fully_achieved' | 'partially_achieved' | undefined;
		time?: string;
	} = $props();

	const color = $derived(entityColor(projectName || prompt));
</script>

<a
	{href}
	class="group flex items-start gap-3.5 px-4 py-3.5 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors"
>
	<span class="w-[3px] self-stretch rounded-full shrink-0" style="background: {color};"></span>

	<div class="min-w-0 flex-1">
		<div class="text-[13.5px] font-medium truncate group-hover:text-accent transition-colors">
			{prompt || 'No prompt'}
		</div>
		<div class="flex items-center gap-3 mt-2 flex-wrap">
			{#if projectName}
				<span
					class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-raised text-text-secondary font-mono text-[10.5px]"
				>
					<span class="w-1.5 h-1.5 rounded-full" style="background: {color};"></span>
					{projectName}
				</span>
			{/if}
			{#if messageCount !== undefined}
				<span class="font-mono text-[11px] text-text-muted">{messageCount} msgs</span>
			{/if}
			{#if durationMinutes}
				<span class="text-text-muted/40">·</span>
				<span class="font-mono text-[11px] text-text-muted">{formatDuration(durationMinutes)}</span>
			{/if}
			{#if model}
				<span class="text-text-muted/40">·</span>
				<span class="font-mono text-[11px] text-text-muted">{model}</span>
			{/if}
		</div>
	</div>

	<div class="flex flex-col items-end gap-1.5 shrink-0">
		{#if outcome === 'fully_achieved'}
			<span class="font-mono text-[10px] px-2 py-0.5 rounded-full text-success bg-success/10">completed</span>
		{:else if outcome === 'partially_achieved'}
			<span class="font-mono text-[10px] px-2 py-0.5 rounded-full text-warning bg-warning/10">partial</span>
		{/if}
		{#if time}
			<span class="font-mono text-[11px] text-text-muted whitespace-nowrap">{relativeTime(time)}</span>
		{/if}
	</div>
</a>
