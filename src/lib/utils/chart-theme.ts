/** Read current theme colors from CSS custom properties */
export function getChartTheme() {
	const style = getComputedStyle(document.documentElement);
	const get = (name: string) => style.getPropertyValue(name).trim();

	return {
		textMuted: get('--color-text-muted') || '#7D7369',
		textSecondary: get('--color-text-secondary') || '#B5ADA4',
		border: get('--color-border') || '#443A30',
		borderSubtle: get('--color-border-subtle') || '#302921',
		accent: get('--color-accent') || '#DA7756',
		success: get('--color-success') || '#5BAA6A',
		warning: get('--color-warning') || '#D4A843',
		error: get('--color-error') || '#D05858',
		info: get('--color-info') || '#6A9FBF',
		gridColor: 'rgba(68, 58, 48, 0.3)'
	};
}

/** Warm palette for multi-series charts */
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
