/** Preset date-range options for list filters. */
export const dateRangeOptions = [
	{ value: 'all', label: 'All time' },
	{ value: '1d', label: 'Last 24 hours' },
	{ value: '7d', label: 'Last 7 days' },
	{ value: '30d', label: 'Last 30 days' },
	{ value: '90d', label: 'Last 90 days' },
	{ value: 'custom', label: 'Custom range' }
];

const RANGE_DAYS: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };

/** Selected range: a rolling preset, or a custom from–to (YYYY-MM-DD strings). */
export interface RangeState {
	preset: string;
	from: string;
	to: string;
}

export function defaultRange(): RangeState {
	return { preset: 'all', from: '', to: '' };
}

function toMs(value: string | number | undefined | null): number {
	if (typeof value === 'number') return value;
	return value ? new Date(value).getTime() : NaN;
}

/**
 * Whether a date value falls within the selected rolling range.
 * Accepts an ISO string or an epoch-millis number. Unparseable / empty values
 * are treated as outside any bounded range (but always pass 'all').
 */
export function withinRange(value: string | number | undefined | null, range: string): boolean {
	if (range === 'all' || !range) return true;
	const days = RANGE_DAYS[range];
	if (!days) return true;

	const ms = toMs(value);
	if (Number.isNaN(ms)) return false;

	return ms >= Date.now() - days * 86_400_000;
}

/** Whether a date value falls within a RangeState (handles both presets and custom). */
export function inRange(value: string | number | undefined | null, range: RangeState): boolean {
	if (range.preset !== 'custom') return withinRange(value, range.preset);

	const ms = toMs(value);
	if (Number.isNaN(ms)) return false;

	const fromMs = range.from ? new Date(`${range.from}T00:00:00`).getTime() : -Infinity;
	const toMs2 = range.to ? new Date(`${range.to}T23:59:59.999`).getTime() : Infinity;
	return ms >= fromMs && ms <= toMs2;
}

/** True when the range actually narrows results (used to decide whether to filter at all). */
export function isRangeActive(range: RangeState): boolean {
	if (range.preset === 'custom') return Boolean(range.from || range.to);
	return range.preset !== 'all';
}
