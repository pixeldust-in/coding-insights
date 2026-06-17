/**
 * Deterministic color for an entity (project / session) derived from a string key.
 * Palette is tuned to read well on BOTH the dark and light Carbon themes —
 * mid-deep hues that work as a solid rail, a tinted avatar, and as text.
 */
const PALETTE = [
	'#D97757', // clay
	'#4F86F7', // blue
	'#0FA968', // green
	'#C2890A', // gold
	'#9A6DF0', // violet
	'#DB6FA0', // rose
	'#0E9BC4', // cyan
	'#E2722A', // orange
	'#5B8C2A', // olive
	'#9333EA', // purple
	'#0EA5A0', // teal
	'#C2521E'  // sienna
];

export function entityColor(key: string): string {
	let h = 0;
	for (let i = 0; i < key.length; i++) {
		h = (h * 31 + key.charCodeAt(i)) >>> 0;
	}
	return PALETTE[h % PALETTE.length];
}

/** Two-letter initials from a project/display name (uses the last path segment). */
export function entityInitials(name: string): string {
	const seg = name.split('/').filter(Boolean).pop() ?? name;
	return seg.slice(0, 2).toUpperCase();
}
