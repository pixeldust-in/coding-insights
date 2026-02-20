/** Read current theme colors from CSS custom properties, scoped to an element's context */
export function getChartTheme(element?: HTMLElement) {
	const target = element?.closest('[data-tool]') as HTMLElement | null;
	const style = getComputedStyle(target || document.documentElement);
	const get = (name: string) => style.getPropertyValue(name).trim();

	const borderColor = get('--color-border') || '#443A30';

	return {
		textMuted: get('--color-text-muted') || '#7D7369',
		textSecondary: get('--color-text-secondary') || '#B5ADA4',
		border: borderColor,
		borderSubtle: get('--color-border-subtle') || '#302921',
		accent: get('--color-accent') || '#DA7756',
		accentRgb: hexToRgb(get('--color-accent') || '#DA7756'),
		success: get('--color-success') || '#5BAA6A',
		warning: get('--color-warning') || '#D4A843',
		error: get('--color-error') || '#D05858',
		info: get('--color-info') || '#6A9FBF',
		gridColor: hexToRgba(borderColor, 0.3)
	};
}

/** Warm palette for multi-series charts (Claude) */
export const chartPalette = [
	'#DA7756', // terracotta
	'#D4A843', // amber
	'#5BAA6A', // sage
	'#6A9FBF', // slate blue
	'#C07BAA', // mauve
	'#8B7EC8', // lavender
	'#E89070', // peach
	'#A8B76A', // olive
	'#D07070', // coral
	'#7DBEAA', // teal
	'#C49560', // caramel
	'#90A4AE', // cool gray
	'#E8A87C', // apricot
	'#7BA5C0', // cerulean
	'#B8886E'  // sienna
];

/** Cool palette for multi-series charts (Codex / OpenAI) */
const codexPalette = [
	'#10A37F', // teal (OpenAI green)
	'#3b82f6', // blue
	'#8b5cf6', // purple
	'#f59e0b', // amber
	'#ef4444', // red
	'#06b6d4', // cyan
	'#ec4899', // pink
	'#84cc16', // lime
	'#f97316', // orange
	'#6366f1', // indigo
	'#14b8a6', // teal alt
	'#64748b', // slate
	'#a855f7', // violet
	'#0ea5e9', // sky
	'#22c55e'  // green
];

/** Get the appropriate chart palette based on the tool context */
export function getChartPalette(element?: HTMLElement): string[] {
	const tool = element?.closest('[data-tool]')?.getAttribute('data-tool');
	return tool === 'codex' ? codexPalette : chartPalette;
}

/** Convert hex color to "r, g, b" string */
function hexToRgb(hex: string): string {
	const h = hex.replace('#', '');
	const r = parseInt(h.substring(0, 2), 16);
	const g = parseInt(h.substring(2, 4), 16);
	const b = parseInt(h.substring(4, 6), 16);
	return `${r}, ${g}, ${b}`;
}

/** Convert hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
	return `rgba(${hexToRgb(hex)}, ${alpha})`;
}
