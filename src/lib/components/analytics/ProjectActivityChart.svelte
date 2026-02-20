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
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { labels: { color: theme.textSecondary, font: { size: 11 } } },
					tooltip: {
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
	<h3 class="text-sm font-semibold text-text-secondary mb-4">{periodLabel(period)} Activity by Project</h3>
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
