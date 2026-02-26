<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import SummaryCard from '$components/analytics/SummaryCard.svelte';
	import UsagePanel from '$components/analytics/UsagePanel.svelte';
	import ActivityChart from '$components/analytics/ActivityChart.svelte';
	import TokenChart from '$components/analytics/TokenChart.svelte';
	import ToolUsageChart from '$components/analytics/ToolUsageChart.svelte';
	import LanguageChart from '$components/analytics/LanguageChart.svelte';
	import HourHeatmap from '$components/analytics/HourHeatmap.svelte';
	import ProjectActivityChart from '$components/analytics/ProjectActivityChart.svelte';
	import ProjectTokenChart from '$components/analytics/ProjectTokenChart.svelte';
	import { formatNumber, formatTokens } from '$utils/format.js';
	import { type TimePeriod, periodOptions } from '$utils/time-period.js';

	let { data } = $props();
	let period = $state<TimePeriod>('week');

	const costLabel = $derived(
		data.totalCost > 0
			? `$${data.totalCost.toFixed(2)}`
			: formatNumber(Math.round(data.stats.totalMessages / (data.activeDays || 1)))
	);
	const costCardLabel = $derived(data.totalCost > 0 ? 'Est. Cost' : 'Avg Msgs/Day');
	const costCardIcon = $derived(data.totalCost > 0 ? '◇' : '⌀');
	const costCardSubtitle = $derived(
		data.totalCost > 0 ? 'Across all models' : `Over ${data.activeDays} active days`
	);

	// Model usage table totals
	const modelTotals = $derived.by(() => {
		let inputTokens = 0;
		let outputTokens = 0;
		let cacheRead = 0;
		let cacheWrite = 0;
		let cost = 0;
		for (const usage of Object.values(data.stats.modelUsage)) {
			inputTokens += usage.inputTokens;
			outputTokens += usage.outputTokens;
			cacheRead += usage.cacheReadInputTokens;
			cacheWrite += usage.cacheCreationInputTokens;
			cost += usage.costUSD || 0;
		}
		return { inputTokens, outputTokens, cacheRead, cacheWrite, cost };
	});
</script>

<Header title="Dashboard" />

<div class="p-6 space-y-6">
	<!-- Summary Cards (server-rendered, instant) -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<SummaryCard
			icon="◈"
			label="Total Sessions"
			value={formatNumber(data.stats.totalSessions)}
			subtitle="Since {new Date(data.stats.firstSessionDate).toLocaleDateString()}"
		/>
		<SummaryCard
			icon="✉"
			label="Total Messages"
			value={formatNumber(data.stats.totalMessages)}
		/>
		<SummaryCard
			icon="◎"
			label="Total Tokens"
			value={formatTokens(data.totalTokens)}
			subtitle="Across all models"
		/>
		<SummaryCard
			icon={costCardIcon}
			label={costCardLabel}
			value={costLabel}
			subtitle={costCardSubtitle}
		/>
	</div>

	<!-- Live Usage (async, loads below KPIs) -->
	<UsagePanel />

	<!-- Activity Over Time -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold text-text-secondary">Activity Over Time</h2>
			<div class="inline-flex bg-surface border border-border-subtle rounded-lg p-1 gap-0.5">
				{#each periodOptions as opt}
					<button
						class="px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer
							{period === opt.value
								? 'bg-accent text-white shadow-sm'
								: 'text-text-muted hover:text-text hover:bg-surface-hover'}"
						onclick={() => (period = opt.value as TimePeriod)}
						type="button"
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Overall -->
		<h3 class="text-xs font-medium text-text-muted uppercase tracking-wider">Overall</h3>
		<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
			{#key period}
				<ActivityChart data={data.stats.dailyActivity} {period} />
				<TokenChart data={data.stats.dailyModelTokens} {period} />
			{/key}
		</div>

		<!-- By Project -->
		<h3 class="text-xs font-medium text-text-muted uppercase tracking-wider">By Project</h3>
		<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
			{#key period}
				<ProjectActivityChart data={data.dailyProjectActivity} {period} />
				<ProjectTokenChart data={data.dailyProjectTokens} {period} />
			{/key}
		</div>
	</div>

	<!-- Distribution Charts -->
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
		<ToolUsageChart data={data.toolCounts} />
		<LanguageChart data={data.languages} />
	</div>

	<!-- Hour Heatmap (full width) -->
	<HourHeatmap data={data.stats.hourCounts} />

	<!-- Model Usage Table -->
	<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
		<h3 class="text-sm font-semibold text-text-secondary mb-4">Model Usage</h3>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="text-left text-text-muted border-b border-border-subtle">
						<th class="pb-2 font-medium">Model</th>
						<th class="pb-2 font-medium text-right">Cost</th>
						<th class="pb-2 font-medium text-right">Input Tokens</th>
						<th class="pb-2 font-medium text-right">Output Tokens</th>
						<th class="pb-2 font-medium text-right">Cache Read</th>
						<th class="pb-2 font-medium text-right">Cache Write</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(data.stats.modelUsage) as [model, usage]}
						<tr class="border-b border-border-subtle/50">
							<td class="py-2 font-mono text-xs text-accent">{model}</td>
							<td class="py-2 text-right tabular-nums">{usage.costUSD > 0 ? `$${usage.costUSD.toFixed(2)}` : '—'}</td>
							<td class="py-2 text-right tabular-nums">{formatTokens(usage.inputTokens)}</td>
							<td class="py-2 text-right tabular-nums">{formatTokens(usage.outputTokens)}</td>
							<td class="py-2 text-right tabular-nums">{formatTokens(usage.cacheReadInputTokens)}</td>
							<td class="py-2 text-right tabular-nums">{formatTokens(usage.cacheCreationInputTokens)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="border-t border-border-subtle font-medium">
						<td class="pt-2 text-text-secondary text-xs">Total</td>
						<td class="pt-2 text-right tabular-nums">{modelTotals.cost > 0 ? `$${modelTotals.cost.toFixed(2)}` : '—'}</td>
						<td class="pt-2 text-right tabular-nums">{formatTokens(modelTotals.inputTokens)}</td>
						<td class="pt-2 text-right tabular-nums">{formatTokens(modelTotals.outputTokens)}</td>
						<td class="pt-2 text-right tabular-nums">{formatTokens(modelTotals.cacheRead)}</td>
						<td class="pt-2 text-right tabular-nums">{formatTokens(modelTotals.cacheWrite)}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
</div>
