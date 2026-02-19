import { formatDistanceToNow, format } from 'date-fns';

export function formatNumber(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
}

export function formatTokens(n: number): string {
	if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toString();
}

export function relativeTime(dateStr: string): string {
	try {
		return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
	} catch {
		return dateStr;
	}
}

export function formatDate(dateStr: string): string {
	try {
		return format(new Date(dateStr), 'MMM d, yyyy');
	} catch {
		return dateStr;
	}
}

export function formatDateTime(dateStr: string): string {
	try {
		return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
	} catch {
		return dateStr;
	}
}

export function formatDuration(minutes: number): string {
	if (minutes < 1) return '<1m';
	if (minutes < 60) return `${Math.round(minutes)}m`;
	const h = Math.floor(minutes / 60);
	const m = Math.round(minutes % 60);
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
