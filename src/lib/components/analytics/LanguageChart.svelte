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
			.slice(0, 10);

		chart = new Chart(canvas, {
			type: 'doughnut',
			data: {
				labels: sorted.map(([k]) => k),
				datasets: [
					{
						data: sorted.map(([, v]) => v),
						backgroundColor: palette.slice(0, sorted.length),
						borderWidth: 0,
						hoverOffset: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '60%',
				plugins: {
					legend: {
						position: 'right',
						labels: { color: theme.textSecondary, font: { size: 11 }, padding: 12 }
					}
				}
			}
		});

		return () => chart?.destroy();
	});
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<h3 class="text-sm font-medium text-text-secondary mb-4">Languages Used</h3>
	<div class="h-64">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
