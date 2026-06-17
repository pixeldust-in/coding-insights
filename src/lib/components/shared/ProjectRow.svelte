<script lang="ts">
	import { relativeTime } from '$utils/format.js';
	import { entityColor, entityInitials } from '$utils/entity-color.js';

	let {
		href,
		name,
		path,
		sessionCount,
		messageCount = undefined,
		lastActive = '',
		maxSessions = 1
	}: {
		href: string;
		name: string;
		path: string;
		sessionCount: number;
		messageCount?: number;
		lastActive?: string;
		maxSessions?: number;
	} = $props();

	const color = $derived(entityColor(path || name));
	const initials = $derived(entityInitials(name));
	const pct = $derived(Math.max(6, Math.round((sessionCount / Math.max(maxSessions, 1)) * 100)));
</script>

<a
	{href}
	class="group flex items-center gap-3.5 px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors"
>
	<span
		class="grid place-items-center w-9 h-9 rounded-lg shrink-0 font-mono text-[12px] font-bold"
		style="background: {color}22; color: {color};"
	>
		{initials}
	</span>

	<div class="min-w-0 flex-1">
		<div class="text-[13.5px] font-semibold truncate group-hover:text-accent transition-colors">
			{name}
		</div>
		<div class="font-mono text-[11px] text-text-muted truncate mt-0.5">{path}</div>
	</div>

	<div class="flex items-center gap-5 shrink-0">
		<div class="hidden xl:flex items-center w-16">
			<span class="w-full h-1.5 rounded-full bg-surface-raised overflow-hidden">
				<span class="block h-full rounded-full" style="width: {pct}%; background: {color};"></span>
			</span>
		</div>
		<div class="text-right w-14">
			<div class="font-mono text-[13px] font-semibold tabular-nums">{sessionCount}</div>
			<div class="font-mono text-[9.5px] uppercase tracking-wider text-text-muted mt-0.5">sessions</div>
		</div>
		{#if messageCount !== undefined}
			<div class="hidden sm:block text-right w-16">
				<div class="font-mono text-[13px] font-semibold tabular-nums">{messageCount.toLocaleString()}</div>
				<div class="font-mono text-[9.5px] uppercase tracking-wider text-text-muted mt-0.5">messages</div>
			</div>
		{/if}
		{#if lastActive}
			<div class="hidden md:block font-mono text-[11px] text-text-muted w-24 text-right">
				{relativeTime(lastActive)}
			</div>
		{/if}
		<span class="text-text-muted group-hover:text-accent transition-colors">›</span>
	</div>
</a>
