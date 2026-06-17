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
		gridColor: hexToRgba(borderColor, 0.45),
		fontMono: get('--font-mono') || "'JetBrains Mono', monospace"
	};
}

/** Carbon categorical palette (Claude) — clay lead + hue-separated supporting colors */
export const chartPalette = [
	'#D97757', // clay (accent)
	'#7AA2F7', // blue
	'#5BAA6A', // green
	'#D4A843', // amber
	'#B18CF2', // violet
	'#7DBEAA', // teal
	'#E8709A', // rose
	'#C07BAA', // mauve
	'#6A9FBF', // slate blue
	'#A8B76A', // olive
	'#E8A87C', // apricot
	'#8B7EC8', // lavender
	'#C49560', // caramel
	'#7BA5C0', // cerulean
	'#90A4AE'  // cool gray
];

/** Carbon categorical palette (Codex) — OpenAI green lead + supporting hues */
const codexPalette = [
	'#10A37F', // green (OpenAI)
	'#2563EB', // blue
	'#7C3AED', // violet
	'#D97706', // amber
	'#0891B2', // cyan
	'#E11D48', // rose
	'#84CC16', // lime
	'#EC4899', // pink
	'#0EA5E9', // sky
	'#6366F1', // indigo
	'#F97316', // orange
	'#14B8A6', // teal
	'#A855F7', // purple
	'#64748B', // slate
	'#22C55E'  // emerald
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
