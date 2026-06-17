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
	let legendItems = $state<{ label: string; color: string }[]>([]);
	let hidden = $state<boolean[]>([]);

	function toggle(i: number) {
		if (!chart) return;
		const nowVisible = !chart.isDatasetVisible(i);
		chart.setDatasetVisibility(i, nowVisible);
		chart.update();
		hidden[i] = !nowVisible;
	}

	function compact(v: number): string {
		const n = Math.abs(v);
		if (n >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${+(v / 1_000).toFixed(0)}k`;
		return String(v);
	}

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
			backgroundColor: palette[i % palette.length] + '14',
			borderWidth: 2,
			fill: true,
			tension: 0.4,
			pointRadius: 0,
			pointHoverRadius: 4
		}));

		legendItems = datasets.map((d) => ({ label: d.label, color: d.borderColor }));
		hidden = legendItems.map(() => false);

		chart = new Chart(canvas, {
			type: 'line',
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { display: false },
					tooltip: { itemSort: (a, b) => (b.raw as number) - (a.raw as number) }
				},
				scales: {
					x: {
						stacked: true,
						ticks: {
							color: theme.textMuted,
							font: { family: theme.fontMono, size: 10 },
							maxRotation: 0,
							autoSkip: true,
							maxTicksLimit: 6
						},
						grid: { display: false },
						border: { display: false }
					},
					y: {
						stacked: true,
						beginAtZero: true,
						ticks: {
							color: theme.textMuted,
							font: { family: theme.fontMono, size: 10 },
							maxTicksLimit: 5,
							callback: (v) => compact(Number(v))
						},
						grid: { color: theme.gridColor, drawTicks: false },
						border: { display: false }
					}
				}
			}
		});

		return () => chart?.destroy();
	});
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<div class="flex items-center justify-between gap-4 mb-4">
		<h3 class="text-sm font-semibold text-text-secondary">{periodLabel(period)} Token Usage by Model</h3>
		<div class="flex items-center gap-3.5 flex-wrap justify-end">
			{#each legendItems as item, i}
				<button
					type="button"
					onclick={() => toggle(i)}
					title="Toggle {item.label}"
					class="flex items-center gap-1.5 text-[11px] font-mono whitespace-nowrap cursor-pointer transition-opacity {hidden[i]
						? 'text-text-muted opacity-60'
						: 'text-text-secondary'}"
				>
					<span
						class="w-2.5 h-2.5 rounded-sm shrink-0"
						style="background:{hidden[i] ? 'transparent' : item.color}; box-shadow: inset 0 0 0 1.5px {item.color};"
					></span>
					<span class={hidden[i] ? 'line-through' : ''}>{item.label}</span>
				</button>
			{/each}
		</div>
	</div>
	<div class="h-64">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
