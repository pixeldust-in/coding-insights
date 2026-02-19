<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { getChartTheme } from '$utils/chart-theme.js';

	let { data }: { data: Record<string, number> } = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		const theme = getChartTheme();
		const hours = Array.from({ length: 24 }, (_, i) => i);
		const values = hours.map((h) => data[String(h)] || 0);
		const labels = hours.map((h) => {
			if (h === 0) return '12am';
			if (h === 12) return '12pm';
			return h < 12 ? `${h}am` : `${h - 12}pm`;
		});

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						data: values,
						backgroundColor: values.map((v) => {
							const max = Math.max(...values);
							const intensity = max > 0 ? v / max : 0;
							return `rgba(218, 119, 86, ${0.15 + intensity * 0.85})`;
						}),
						borderRadius: 4,
						barPercentage: 0.8
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: {
						ticks: { color: theme.textMuted, font: { size: 9 }, maxRotation: 0 },
						grid: { display: false }
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
	<h3 class="text-sm font-medium text-text-secondary mb-4">Activity by Hour</h3>
	<div class="h-48">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
