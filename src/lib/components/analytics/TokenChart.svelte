<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { getChartTheme, getChartPalette } from '$utils/chart-theme.js';
	import { type TimePeriod, periodLabel, aggregateModelTokens, formatPeriodLabel } from '$utils/time-period.js';

	let {
		data,
		period = 'day'
	}: {
		data: { date: string; tokensByModel: Record<string, number> }[];
		period?: TimePeriod;
	} = $props();

	let aggregated = $derived(aggregateModelTokens(data, period));

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		const theme = getChartTheme(canvas);
		const palette = getChartPalette(canvas);
		const models = new Set<string>();
		aggregated.forEach((d) => Object.keys(d.tokensByModel).forEach((m) => models.add(m)));

		const labels = aggregated.map((d) => formatPeriodLabel(d.date, period));

		const datasets = Array.from(models).map((model, i) => ({
			label: model.replace('claude-', '').replace(/-\d{8,}$/, ''),
			data: aggregated.map((d) => d.tokensByModel[model] || 0),
			borderColor: palette[i % palette.length],
			backgroundColor: palette[i % palette.length] + '20',
			fill: true,
			tension: 0.3,
			pointRadius: 0,
			pointHoverRadius: 4
		}));

		chart = new Chart(canvas, {
			type: 'line',
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { labels: { color: theme.textSecondary, font: { size: 11 } } }
				},
				scales: {
					x: {
						stacked: true,
						ticks: { color: theme.textMuted, font: { size: 10 }, maxTicksLimit: 15 },
						grid: { color: theme.gridColor }
					},
					y: {
						stacked: true,
						ticks: {
							color: theme.textMuted,
							font: { size: 10 },
							callback: (v) => {
								const num = Number(v);
								return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : v;
							}
						},
						grid: { color: theme.gridColor }
					}
				}
			}
		});

		return () => chart?.destroy();
	});
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<h3 class="text-sm font-semibold text-text-secondary mb-4">{periodLabel(period)} Token Usage by Model</h3>
	<div class="h-64">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
