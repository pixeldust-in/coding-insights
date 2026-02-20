<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { getChartTheme, getChartPalette } from '$utils/chart-theme.js';
	import type { ProjectTokenUsage } from '$lib/server/types.js';

	let {
		data
	}: {
		data: ProjectTokenUsage[];
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function formatTokenValue(v: number): string {
		if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
		if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
		return String(v);
	}

	onMount(() => {
		if (!data.length) return;

		const theme = getChartTheme(canvas);
		const palette = getChartPalette(canvas);

		const labels = data.map((d) => d.project);

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Input Tokens',
						data: data.map((d) => d.inputTokens),
						backgroundColor: palette[0],
						borderColor: palette[0],
						borderWidth: 1
					},
					{
						label: 'Output Tokens',
						data: data.map((d) => d.outputTokens),
						backgroundColor: palette[1],
						borderColor: palette[1],
						borderWidth: 1
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { labels: { color: theme.textSecondary, font: { size: 11 } } },
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: ${formatTokenValue(ctx.raw as number)}`
						}
					}
				},
				scales: {
					x: {
						stacked: true,
						ticks: {
							color: theme.textMuted,
							font: { size: 10 },
							callback: (v) => formatTokenValue(Number(v))
						},
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
	<h3 class="text-sm font-medium text-text-secondary mb-4">Token Usage by Project</h3>
	{#if data.length}
		<div class="h-80">
			<canvas bind:this={canvas}></canvas>
		</div>
	{:else}
		<div class="h-80 flex items-center justify-center text-text-muted text-sm">
			No project token data available
		</div>
	{/if}
</div>
