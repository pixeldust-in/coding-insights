<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { getChartTheme, getChartPalette } from '$utils/chart-theme.js';
	import { type TimePeriod, periodLabel, aggregateProjectActivity, formatPeriodLabel } from '$utils/time-period.js';
	import type { DailyProjectActivity } from '$lib/server/types.js';

	let {
		data,
		period = 'day'
	}: {
		data: DailyProjectActivity[];
		period?: TimePeriod;
	} = $props();

	let aggregated = $derived(aggregateProjectActivity(data, period));

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	let legendItems = $state<{ label: string; color: string }[]>([]);

	onMount(() => {
		if (!aggregated.length) return;

		const theme = getChartTheme(canvas);
		const palette = getChartPalette(canvas);

		// Collect all project names
		const projectSet = new Set<string>();
		aggregated.forEach((d) => Object.keys(d.byProject).forEach((p) => projectSet.add(p)));

		// Sort alphabetically, but push "Other" to the end
		const projects = Array.from(projectSet).sort((a, b) => {
			if (a === 'Other') return 1;
			if (b === 'Other') return -1;
			return a.localeCompare(b);
		});

		legendItems = projects.map((p, i) => ({ label: p, color: palette[i % palette.length] }));

		const labels = aggregated.map((d) => formatPeriodLabel(d.date, period));

		const datasets = projects.map((project, i) => ({
			label: project,
			data: aggregated.map((d) => d.byProject[project] || 0),
			backgroundColor: palette[i % palette.length],
			borderColor: palette[i % palette.length],
			borderWidth: 1
		}));

		chart = new Chart(canvas, {
			type: 'bar',
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: { padding: { top: 0 } },
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { display: false },
					tooltip: {
						itemSort: (a, b) => (b.raw as number) - (a.raw as number),
						callbacks: {
							footer: (items) => {
								const total = items.reduce((sum, item) => sum + (item.raw as number), 0);
								return `Total: ${total}`;
							}
						}
					}
				},
				scales: {
					x: {
						stacked: true,
						ticks: { color: theme.textMuted, font: { size: 10 }, maxTicksLimit: 15 },
						grid: { color: theme.gridColor }
					},
					y: {
						stacked: true,
						ticks: { color: theme.textMuted, font: { size: 10 } },
						grid: { color: theme.gridColor }
					}
				}
			}
		});

		return () => chart?.destroy();
	});
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<h3 class="text-sm font-semibold text-text-secondary mb-2">{periodLabel(period)} Activity by Project</h3>
	{#if legendItems.length}
		<div class="flex flex-wrap gap-x-3 gap-y-1 mb-2 max-h-10 overflow-hidden">
			{#each legendItems as item}
				<span class="flex items-center gap-1.5 text-[10px] text-text-secondary whitespace-nowrap">
					<span class="w-2.5 h-2.5 rounded-sm shrink-0" style="background:{item.color}"></span>
					{item.label}
				</span>
			{/each}
		</div>
	{/if}
	{#if data.length}
		<div class="h-64">
			<canvas bind:this={canvas}></canvas>
		</div>
	{:else}
		<div class="h-64 flex items-center justify-center text-text-muted text-sm">
			No project activity data available
		</div>
	{/if}
</div>
