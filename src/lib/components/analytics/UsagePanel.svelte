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

	let { apiUrl = '/api/claude/usage' }: { apiUrl?: string } = $props();

	let usage: UsageData | null = $state(null);
	let loading = $state(true);
	let error: string | null = $state(null);
	let spinning = $state(false);
	let lastFetched: Date | null = $state(null);
	let stale = $state(false);
	let retryTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleRetry(seconds: number) {
		if (retryTimer) clearTimeout(retryTimer);
		retryTimer = setTimeout(() => fetchUsage(), Math.max(5, seconds) * 1000);
	}
	function clearRetry() {
		if (retryTimer) clearTimeout(retryTimer);
		retryTimer = null;
	}

	async function fetchUsage() {
		spinning = true;
		try {
			const res = await fetch(apiUrl);
			const data = await res.json();
			const retryAfter = Number(data.retryAfter) || 60;

			if (data.error) {
				// No usable data returned.
				if (res.status === 429 || data.rateLimited) {
					error = `Rate limited — retrying in ${retryAfter}s`;
					scheduleRetry(retryAfter);
				} else {
					error = data.error;
					clearRetry();
				}
			} else {
				// Got usage (possibly served stale from cache during a throttle).
				usage = data;
				stale = Boolean(data.stale);
				if (!stale) lastFetched = new Date();
				if (data.rateLimited) {
					error = null;
					scheduleRetry(retryAfter);
				} else {
					error = null;
					clearRetry();
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch usage';
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

	function agoLabel(date: Date): string {
		try {
			return `updated ${formatDistanceToNow(date, { addSuffix: true })}`;
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

	// Fetch on mount; cancel any pending retry on teardown
	$effect(() => {
		fetchUsage();
		return () => clearRetry();
	});
</script>

<div class="relative overflow-hidden bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<div class="flex items-center gap-2.5 mb-4">
		<span class="relative flex w-[7px] h-[7px] shrink-0">
			<span class="absolute inline-flex w-full h-full rounded-full bg-success opacity-60 animate-ping"></span>
			<span class="relative inline-flex w-[7px] h-[7px] rounded-full bg-success"></span>
		</span>
		<h3 class="text-[13px] font-semibold text-text">Live Usage</h3>
		{#if lastFetched}
			<span class="ml-auto text-[11px] font-mono text-text-muted">
				{agoLabel(lastFetched)}{#if stale}<span class="text-warning"> · cached</span>{/if}
			</span>
		{/if}
		<button
			onclick={fetchUsage}
			disabled={spinning}
			class="{lastFetched ? '' : 'ml-auto'} p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
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
	{:else if windows.length > 0}
		<div
			class="grid gap-x-8 gap-y-5"
			style="grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));"
		>
			{#each windows as win}
				{@const util = Math.round(win.data.utilization)}
				{@const color = barColor(util)}
				<div>
					<div class="flex items-baseline justify-between mb-2">
						<span class="text-[12.5px] font-semibold text-text">{win.label}</span>
						<span class="text-[13px] font-mono font-semibold tabular-nums" style="color: {color}"
							>{util}%</span
						>
					</div>
					<div class="h-1.5 rounded-full bg-surface-raised overflow-hidden">
						<div
							class="h-full rounded-full transition-all duration-500"
							style="width: {util}%; background: {color}"
						></div>
					</div>
					{#if win.data.resets_at}
						<p class="text-[10.5px] font-mono text-text-muted mt-2">{resetLabel(win.data.resets_at)}</p>
					{/if}
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="text-sm py-2 {error.startsWith('Rate limited') ? 'text-warning' : 'text-error'}">
			{#if error.startsWith('Rate limited')}
				{error}
			{:else}
				<span class="font-medium">Error:</span>
				{error}
			{/if}
		</div>
	{:else}
		<p class="text-sm text-text-muted py-2">No usage data available.</p>
	{/if}
</div>
