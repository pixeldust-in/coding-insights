/**
 * Decode a Claude project directory name into the original filesystem path.
 * e.g. "-Users-mohammed-work-pixeldust-foo" -> "/Users/mohammed/work/pixeldust/foo"
 */
export function decodeDirName(dirName: string): string {
	// Replace leading dash and all dashes with slashes
	// Claude encodes "/" as "-"
	return '/' + dirName.slice(1).replace(/-/g, '/');
}

/**
 * Encode a filesystem path into a Claude project directory name.
 * e.g. "/Users/mohammed/work/pixeldust/foo" -> "-Users-mohammed-work-pixeldust-foo"
 */
export function encodePath(fsPath: string): string {
	return fsPath.replace(/\//g, '-');
}

/**
 * Get a short display name from a decoded path.
 * e.g. "/Users/mohammed/work/pixeldust/foo" -> "pixeldust/foo"
 */
export function shortName(decodedPath: string): string {
	const parts = decodedPath.split('/').filter(Boolean);
	// Skip common prefixes like Users/username/work
	const homeIdx = parts.indexOf('mohammed');
	if (homeIdx !== -1) {
		const relevant = parts.slice(homeIdx + 1);
		// Skip 'work' if it follows home dir
		if (relevant[0] === 'work' || relevant[0] === 'personal') {
			return relevant.slice(1).join('/') || relevant.join('/');
		}
		return relevant.join('/') || parts[parts.length - 1];
	}
	return parts.slice(-2).join('/');
}
