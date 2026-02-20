import { startOfWeek, endOfWeek, format } from 'date-fns';

export type TimePeriod = 'day' | 'week' | 'month';

export const periodOptions = [
	{ value: 'day', label: 'Daily' },
	{ value: 'week', label: 'Weekly' },
	{ value: 'month', label: 'Monthly' }
];

export function periodLabel(period: TimePeriod): string {
	return period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : 'Monthly';
}

export function getPeriodKey(dateStr: string, period: TimePeriod): string {
	if (period === 'day') return dateStr;
	const date = new Date(dateStr + 'T00:00:00');
	if (period === 'week') {
		const monday = startOfWeek(date, { weekStartsOn: 1 });
		return format(monday, 'yyyy-MM-dd');
	}
	return format(date, 'yyyy-MM');
}

export function formatPeriodLabel(key: string, period: TimePeriod): string {
	if (period === 'day') {
		const dt = new Date(key + 'T00:00:00');
		return `${dt.getMonth() + 1}/${dt.getDate()}`;
	}
	if (period === 'week') {
		const monday = new Date(key + 'T00:00:00');
		const sunday = endOfWeek(monday, { weekStartsOn: 1 });
		return `${format(monday, 'MMM d')} - ${format(sunday, 'd')}`;
	}
	const dt = new Date(key + '-01T00:00:00');
	return format(dt, 'MMM yyyy');
}

type ActivityRow = { date: string; messageCount: number; sessionCount: number; toolCallCount: number };

export function aggregateActivity(data: ActivityRow[], period: TimePeriod): ActivityRow[] {
	if (period === 'day') return data;
	const map = new Map<string, ActivityRow>();
	for (const d of data) {
		const key = getPeriodKey(d.date, period);
		const existing = map.get(key);
		if (existing) {
			existing.messageCount += d.messageCount;
			existing.sessionCount += d.sessionCount;
			existing.toolCallCount += d.toolCallCount;
		} else {
			map.set(key, { date: key, messageCount: d.messageCount, sessionCount: d.sessionCount, toolCallCount: d.toolCallCount });
		}
	}
	return Array.from(map.values());
}

type ModelTokenRow = { date: string; tokensByModel: Record<string, number> };

export function aggregateModelTokens(data: ModelTokenRow[], period: TimePeriod): ModelTokenRow[] {
	if (period === 'day') return data;
	const map = new Map<string, ModelTokenRow>();
	for (const d of data) {
		const key = getPeriodKey(d.date, period);
		const existing = map.get(key);
		if (existing) {
			for (const [model, tokens] of Object.entries(d.tokensByModel)) {
				existing.tokensByModel[model] = (existing.tokensByModel[model] || 0) + tokens;
			}
		} else {
			map.set(key, { date: key, tokensByModel: { ...d.tokensByModel } });
		}
	}
	return Array.from(map.values());
}

type ProjectTokenRow = { date: string; byProject: Record<string, { input: number; output: number }> };

export function aggregateProjectTokens(data: ProjectTokenRow[], period: TimePeriod): ProjectTokenRow[] {
	if (period === 'day') return data;
	const map = new Map<string, ProjectTokenRow>();
	for (const d of data) {
		const key = getPeriodKey(d.date, period);
		const existing = map.get(key);
		if (existing) {
			for (const [project, tokens] of Object.entries(d.byProject)) {
				if (!existing.byProject[project]) existing.byProject[project] = { input: 0, output: 0 };
				existing.byProject[project].input += tokens.input;
				existing.byProject[project].output += tokens.output;
			}
		} else {
			const byProject: Record<string, { input: number; output: number }> = {};
			for (const [project, tokens] of Object.entries(d.byProject)) {
				byProject[project] = { input: tokens.input, output: tokens.output };
			}
			map.set(key, { date: key, byProject });
		}
	}
	return Array.from(map.values());
}

type ProjectActivityRow = { date: string; byProject: Record<string, number> };

export function aggregateProjectActivity(data: ProjectActivityRow[], period: TimePeriod): ProjectActivityRow[] {
	if (period === 'day') return data;
	const map = new Map<string, ProjectActivityRow>();
	for (const d of data) {
		const key = getPeriodKey(d.date, period);
		const existing = map.get(key);
		if (existing) {
			for (const [project, count] of Object.entries(d.byProject)) {
				existing.byProject[project] = (existing.byProject[project] || 0) + count;
			}
		} else {
			map.set(key, { date: key, byProject: { ...d.byProject } });
		}
	}
	return Array.from(map.values());
}
