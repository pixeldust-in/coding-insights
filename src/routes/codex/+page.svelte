<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import SummaryCard from '$components/analytics/SummaryCard.svelte';
	import ActivityChart from '$components/analytics/ActivityChart.svelte';
	import ToolUsageChart from '$components/analytics/ToolUsageChart.svelte';
	import HourHeatmap from '$components/analytics/HourHeatmap.svelte';
	import ProjectActivityChart from '$components/analytics/ProjectActivityChart.svelte';
	import ProjectTokenChart from '$components/analytics/ProjectTokenChart.svelte';
	import { formatNumber, formatTokens } from '$utils/format.js';

	let { data } = $props();

	// Map codex daily activity to the shape ActivityChart expects
	let activityData = $derived(
		data.stats.dailyActivity.map((d) => ({
			date: d.date,
			messageCount: d.messageCount,
			sessionCount: d.sessionCount,
			toolCallCount: 0
		}))
	);
</script>

<Header title="Dashboard" />

<div class="p-6 space-y-6">
	<!-- Summary Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<SummaryCard
			icon="◆"
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
			value={formatTokens(data.stats.totalTokens)}
			subtitle="Across all models"
		/>
		<SummaryCard
			icon="◈"
			label="Active Days"
			value={String(data.stats.activeDays)}
		/>
	</div>

	<!-- Charts -->
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
		<ActivityChart data={activityData} />
		<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
			<h3 class="text-sm font-medium text-text-secondary mb-4">Model Usage</h3>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-text-muted border-b border-border-subtle">
							<th class="pb-2 font-medium">Model</th>
							<th class="pb-2 font-medium text-right">Input Tokens</th>
							<th class="pb-2 font-medium text-right">Output Tokens</th>
							<th class="pb-2 font-medium text-right">Reasoning</th>
						</tr>
					</thead>
					<tbody>
						{#each Object.entries(data.stats.modelTokens) as [model, usage]}
							<tr class="border-b border-border-subtle/50">
								<td class="py-2 font-mono text-xs text-accent">{model}</td>
								<td class="py-2 text-right tabular-nums">{formatTokens(usage.input)}</td>
								<td class="py-2 text-right tabular-nums">{formatTokens(usage.output)}</td>
								<td class="py-2 text-right tabular-nums">{formatTokens(usage.reasoning)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Project Charts -->
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
		<ProjectActivityChart data={data.stats.dailyProjectActivity} />
		<ProjectTokenChart data={data.stats.projectTokenUsage} />
	</div>

	<!-- Charts Row 2 -->
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
		<ToolUsageChart data={data.stats.functionCallCounts} />
		<HourHeatmap data={data.stats.hourCounts} />
	</div>
</div>
