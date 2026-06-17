<script lang="ts">
	let {
		icon,
		label,
		value,
		subtitle = '',
		spark = [],
		tone = 'accent'
	}: {
		icon: string;
		label: string;
		value: string | number;
		subtitle?: string;
		spark?: number[];
		tone?: 'accent' | 'success' | 'info' | 'warning';
	} = $props();

	const strokeVar = $derived(`var(--color-${tone})`);

	// Build a normalized polyline (viewBox 90x40) from the spark series
	const points = $derived.by(() => {
		if (!spark || spark.length < 2) return '';
		const max = Math.max(...spark);
		const min = Math.min(...spark);
		const range = max - min || 1;
		const w = 90;
		const h = 40;
		const pad = 4;
		return spark
			.map((v, i) => {
				const x = (i / (spark.length - 1)) * w;
				const y = h - pad - ((v - min) / range) * (h - pad * 2);
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	});
</script>

<div
	class="relative overflow-hidden bg-surface border border-border-subtle rounded-xl p-[18px] card-elevated transition-all duration-150 hover:-translate-y-0.5 hover:border-border"
>
	<div class="flex items-center justify-between">
		<p class="text-text-muted text-[10.5px] font-mono font-medium uppercase tracking-[0.1em]">{label}</p>
		<span class="text-base text-text-muted opacity-50">{icon}</span>
	</div>
	<p class="text-[30px] font-bold tracking-tight leading-none mt-2.5 tabular-nums">{value}</p>
	{#if subtitle}
		<p class="text-text-secondary text-[11px] font-mono mt-1">{subtitle}</p>
	{/if}
	{#if points}
		<svg
			class="absolute right-0 bottom-0 w-[90px] h-10 opacity-55 pointer-events-none"
			viewBox="0 0 90 40"
			preserveAspectRatio="none"
		>
			<polyline fill="none" stroke={strokeVar} stroke-width="1.5" points={points} />
		</svg>
	{/if}
</div>
