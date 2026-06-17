<script lang="ts">
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { getChartTheme } from '$utils/chart-theme.js';
	import { type TimePeriod, periodLabel, aggregateActivity, formatPeriodLabel } from '$utils/time-period.js';

	let {
		data,
		period = 'day'
	}: {
		data: { date: string; messageCount: number; sessionCount: number; toolCallCount: number }[];
		period?: TimePeriod;
	} = $props();

	let aggregated = $derived(aggregateActivity(data, period));

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
		if (n >= 1_000_000) return `${v / 1_000_000}M`;
		if (n >= 1_000) return `${v / 1_000}k`;
		return String(v);
	}

	function areaFill(color: string) {
		return (ctx: { chart: Chart }) => {
			const { chartArea, ctx: c } = ctx.chart;
			if (!chartArea) return 'transparent';
			const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
			g.addColorStop(0, `${color}40`);
			g.addColorStop(1, `${color}00`);
			return g;
		};
	}

	onMount(() => {
		const theme = getChartTheme(canvas);
		const labels = aggregated.map((d) => formatPeriodLabel(d.date, period));

		legendItems = [
			{ label: 'Messages', color: theme.accent },
			{ label: 'Tool Calls', color: theme.success }
		];
		hidden = legendItems.map(() => false);

		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Messages',
						data: aggregated.map((d) => d.messageCount),
						borderColor: theme.accent,
						backgroundColor: areaFill(theme.accent),
						borderWidth: 2,
						fill: true,
						tension: 0.4,
						pointRadius: 0,
						pointHoverRadius: 4
					},
					{
						label: 'Tool Calls',
						data: aggregated.map((d) => d.toolCallCount),
						borderColor: theme.success,
						backgroundColor: areaFill(theme.success),
						borderWidth: 2,
						fill: true,
						tension: 0.4,
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
					legend: { display: false },
					tooltip: { itemSort: (a, b) => (b.raw as number) - (a.raw as number) }
				},
				scales: {
					x: {
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
		<h3 class="text-sm font-semibold text-text-secondary">{periodLabel(period)} Activity</h3>
		<div class="flex items-center gap-3.5">
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
