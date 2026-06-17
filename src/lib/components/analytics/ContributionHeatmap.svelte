<script lang="ts">
	let {
		data,
		unit = 'messages'
	}: {
		data: { date: string; messageCount: number }[];
		unit?: string;
	} = $props();

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
	const WEEKS_BACK = 52;

	function fmt(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
	function startOfDay(d: Date): Date {
		const n = new Date(d);
		n.setHours(0, 0, 0, 0);
		return n;
	}

	let counts = $derived.by(() => {
		const m = new Map<string, number>();
		for (const d of data) m.set(d.date, (m.get(d.date) ?? 0) + d.messageCount);
		return m;
	});

	let calendar = $derived.by(() => {
		let max = 0;
		counts.forEach((v) => {
			if (v > max) max = v;
		});

		const end = startOfDay(new Date());
		// Always render a trailing full year so the grid fills the full width
		const start = new Date(end);
		start.setDate(end.getDate() - end.getDay() - WEEKS_BACK * 7);

		const weeks: { key: string; count: number; date: Date }[][] = [];
		const cur = new Date(start);
		let total = 0;
		while (cur <= end) {
			const col: { key: string; count: number; date: Date }[] = [];
			for (let d = 0; d < 7; d++) {
				const key = fmt(cur);
				const future = cur > end;
				const count = future ? -1 : (counts.get(key) ?? 0);
				if (count > 0) total += count;
				col.push({ key, count, date: new Date(cur) });
				cur.setDate(cur.getDate() + 1);
			}
			weeks.push(col);
		}

		const monthLabels: string[] = [];
		let lastMonth = -1;
		for (const col of weeks) {
			const m = col[0].date.getMonth();
			if (m !== lastMonth) {
				monthLabels.push(MONTHS[m]);
				lastMonth = m;
			} else {
				monthLabels.push('');
			}
		}

		return { weeks, max, total, monthLabels };
	});

	// Exact artifact look: accent color at increasing alpha; empty days use the track color
	function cellStyle(count: number, max: number): string {
		if (count < 0) return 'background:transparent';
		if (count === 0) return 'background:var(--color-surface-raised)';
		const ratio = max > 0 ? count / max : 0;
		const pct = Math.round((0.18 + ratio * 0.82) * 100);
		return `background:color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`;
	}

	const LEGEND = [0, 0.2, 0.45, 0.7, 1];
	function legendStyle(level: number): string {
		if (level === 0) return 'background:var(--color-surface-raised)';
		const pct = Math.round((0.18 + level * 0.82) * 100);
		return `background:color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`;
	}

	// ── GitHub-style hover tooltip ──
	let container: HTMLDivElement;
	let tip = $state<{ show: boolean; x: number; y: number; count: number; label: string }>({
		show: false,
		x: 0,
		y: 0,
		count: 0,
		label: ''
	});

	function showTip(e: MouseEvent, cell: { count: number; date: Date }) {
		if (cell.count < 0 || !container) return;
		const cont = container.getBoundingClientRect();
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tip = {
			show: true,
			x: r.left - cont.left + r.width / 2,
			y: r.top - cont.top,
			count: cell.count,
			label: cell.date.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			})
		};
	}
	function hideTip() {
		tip = { ...tip, show: false };
	}
</script>

<div class="bg-surface border border-border-subtle rounded-xl p-5 card-elevated">
	<div class="flex items-baseline justify-between mb-4">
		<h3 class="text-sm font-semibold text-text-secondary">Activity</h3>
		<span class="text-[11px] font-mono text-text-muted">
			{calendar.total.toLocaleString()}
			{unit} · last year
		</span>
	</div>

	<div class="relative" bind:this={container}>
		<div class="grid items-start" style="grid-template-columns: auto minmax(0, 1fr); column-gap: 6px;">
			<!-- corner spacer -->
			<div></div>
			<!-- month labels -->
			<div
				class="grid mb-[3px] h-[13px]"
				style="grid-template-columns: repeat({calendar.weeks.length}, minmax(0, 1fr)); gap: 3px;"
			>
				{#each calendar.monthLabels as label}
					<div class="relative">
						{#if label}
							<span class="absolute left-0 top-0 text-[10px] font-mono text-text-muted whitespace-nowrap">{label}</span>
						{/if}
					</div>
				{/each}
			</div>

			<!-- weekday labels -->
			<div class="flex flex-col gap-[3px] pr-1 self-stretch">
				{#each WEEKDAYS as wd}
					<div class="flex-1 flex items-center justify-end min-h-[10px]">
						<span class="text-[9px] font-mono text-text-muted leading-none">{wd}</span>
					</div>
				{/each}
			</div>

			<!-- weeks -->
			<div
				class="grid"
				style="grid-template-columns: repeat({calendar.weeks.length}, minmax(0, 1fr)); gap: 3px;"
			>
				{#each calendar.weeks as week}
					<div class="flex flex-col gap-[3px]">
						{#each week as cell}
							<div
								role="presentation"
								class="w-full aspect-square rounded-[2px] transition-[outline] hover:outline hover:outline-1 hover:outline-text-muted"
								style={cellStyle(cell.count, calendar.max)}
								onmouseenter={(e) => showTip(e, cell)}
								onmouseleave={hideTip}
							></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		{#if tip.show}
			<div
				class="pointer-events-none absolute z-20 px-2.5 py-1.5 rounded-md bg-surface-raised border border-border shadow-lg whitespace-nowrap"
				style="left: {tip.x}px; top: {tip.y}px; transform: translate(-50%, calc(-100% - 7px));"
			>
				<span class="text-[11px] font-mono text-text">
					<span class="font-semibold">{tip.count === 0 ? `No ${unit}` : `${tip.count.toLocaleString()} ${unit}`}</span>
					<span class="text-text-muted">· {tip.label}</span>
				</span>
				<span
					class="absolute left-1/2 -bottom-[4px] -translate-x-1/2 w-2 h-2 rotate-45 bg-surface-raised border-r border-b border-border"
				></span>
			</div>
		{/if}
	</div>

	<!-- legend -->
	<div class="flex items-center justify-end gap-1.5 mt-3">
		<span class="text-[10px] font-mono text-text-muted">Less</span>
		{#each LEGEND as level}
			<div class="w-[11px] h-[11px] rounded-[2px]" style={legendStyle(level)}></div>
		{/each}
		<span class="text-[10px] font-mono text-text-muted">More</span>
	</div>
</div>
