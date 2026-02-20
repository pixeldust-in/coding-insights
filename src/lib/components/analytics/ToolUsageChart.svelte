<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { getChartTheme, getChartPalette } from '$utils/chart-theme.js';

	let { data }: { data: Record<string, number> } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		const theme = getChartTheme(canvas);
		const palette = getChartPalette(canvas);
		const sorted = Object.entries(data)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 15);

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: sorted.map(([k]) => k),
				datasets: [
					{
						data: sorted.map(([, v]) => v),
						backgroundColor: sorted.map((_, i) => palette[i % palette.length] + 'cc'),
						borderRadius: 4,
						barThickness: 20
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: {
						ticks: { color: theme.textMuted, font: { size: 10 } },
						grid: { color: theme.gridColor }
					},
					y: {
						ticks: { color: theme.textSecondary, font: { size: 11 } },
						grid: { display: false }
					}
				}
			}
		});

		return () => chart?.destroy();
	});
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<h3 class="text-sm font-medium text-text-secondary mb-4">Most Used Tools</h3>
	<div class="h-80">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
