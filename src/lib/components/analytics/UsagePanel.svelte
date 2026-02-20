<script lang="ts">
	import { formatDistanceToNow } from 'date-fns';

	interface UsageWindow {
		utilization: number;
		resets_at: string;
	}

	interface UsageData {
		five_hour?: UsageWindow | null;
		seven_day?: UsageWindow | null;
		seven_day_opus?: UsageWindow | null;
		seven_day_sonnet?: UsageWindow | null;
		seven_day_cowork?: UsageWindow | null;
		seven_day_oauth_apps?: UsageWindow | null;
		extra_usage?: {
			is_enabled: boolean;
			monthly_limit: number | null;
			used_credits: number | null;
			utilization: number | null;
		} | null;
		error?: string;
	}

	let usage: UsageData | null = $state(null);
	let loading = $state(true);
	let error: string | null = $state(null);
	let spinning = $state(false);

	async function fetchUsage() {
		spinning = true;
		error = null;
		try {
			const res = await fetch('/api/claude/usage');
			const data = await res.json();
			if (data.error) {
				error = data.error;
				usage = null;
			} else {
				usage = data;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch usage';
			usage = null;
		} finally {
			loading = false;
			// Keep spin animation for at least 500ms for visual feedback
			setTimeout(() => (spinning = false), 500);
		}
	}

	function barColor(util: number): string {
		if (util >= 80) return 'var(--color-error)';
		if (util >= 50) return 'var(--color-warning)';
		return 'var(--color-success)';
	}

	function resetLabel(resetsAt: string): string {
		try {
			return `Resets ${formatDistanceToNow(new Date(resetsAt), { addSuffix: true })}`;
		} catch {
			return '';
		}
	}

	const windows = $derived.by(() => {
		if (!usage) return [];
		const entries: { label: string; data: UsageWindow }[] = [];
		if (usage.five_hour) entries.push({ label: '5-Hour', data: usage.five_hour });
		if (usage.seven_day) entries.push({ label: '7-Day', data: usage.seven_day });
		if (usage.seven_day_opus) entries.push({ label: '7-Day Opus', data: usage.seven_day_opus });
		if (usage.seven_day_sonnet)
			entries.push({ label: '7-Day Sonnet', data: usage.seven_day_sonnet });
		if (usage.seven_day_cowork)
			entries.push({ label: '7-Day Cowork', data: usage.seven_day_cowork });
		return entries;
	});

	// Fetch on mount
	$effect(() => {
		fetchUsage();
	});
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-sm font-medium text-text-secondary">Live Usage</h3>
		<button
			onclick={fetchUsage}
			disabled={spinning}
			class="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
			title="Refresh usage data"
		>
			<svg
				class="w-4 h-4 {spinning ? 'animate-spin' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
		</button>
	</div>

	{#if loading && !usage}
		<div class="flex items-center gap-2 text-text-muted text-sm py-4">
			<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				></path>
			</svg>
			Loading usage data...
		</div>
	{:else if error}
		<div class="text-sm text-error py-2">
			<span class="font-medium">Error:</span>
			{error}
		</div>
	{:else if windows.length > 0}
		<div class="grid grid-cols-3 gap-4">
			{#each windows as win}
				{@const util = Math.round(win.data.utilization)}
				{@const color = barColor(util)}
				<div>
					<div class="flex items-baseline justify-between mb-1.5">
						<span class="text-xs font-medium text-text-secondary">{win.label}</span>
						<span class="text-xs font-mono tabular-nums" style="color: {color}"
							>{util}%</span
						>
					</div>
					<div class="h-2 rounded-full bg-surface-raised overflow-hidden">
						<div
							class="h-full rounded-full transition-all duration-500"
							style="width: {util}%; background: {color}"
						></div>
					</div>
					{#if win.data.resets_at}
						<p class="text-[10px] text-text-muted mt-1">{resetLabel(win.data.resets_at)}</p>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-text-muted py-2">No usage data available.</p>
	{/if}
</div>
