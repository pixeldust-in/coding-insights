<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { getChartTheme } from '$utils/chart-theme.js';

	let {
		data
	}: {
		data: { date: string; messageCount: number; sessionCount: number; toolCallCount: number }[];
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		const theme = getChartTheme();
		const labels = data.map((d) => {
			const dt = new Date(d.date);
			return `${dt.getMonth() + 1}/${dt.getDate()}`;
		});

		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Messages',
						data: data.map((d) => d.messageCount),
						borderColor: theme.accent,
						backgroundColor: theme.accent + '18',
						fill: true,
						tension: 0.3,
						pointRadius: 0,
						pointHoverRadius: 4
					},
					{
						label: 'Tool Calls',
						data: data.map((d) => d.toolCallCount),
						borderColor: theme.success,
						backgroundColor: theme.success + '0d',
						fill: true,
						tension: 0.3,
						pointRadius: 0,
						pointHoverRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { labels: { color: theme.textSecondary, font: { size: 11 } } }
				},
				scales: {
					x: {
						ticks: { color: theme.textMuted, font: { size: 10 }, maxTicksLimit: 15 },
						grid: { color: theme.gridColor }
					},
					y: {
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
	<h3 class="text-sm font-medium text-text-secondary mb-4">Daily Activity</h3>
	<div class="h-64">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
