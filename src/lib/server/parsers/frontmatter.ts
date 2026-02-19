export interface Frontmatter {
	[key: string]: string;
}

/**
 * Parse YAML-like frontmatter from markdown files.
 * Simple regex-based parser — no dependency needed.
 */
export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
	const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	if (!match) {
		return { frontmatter: {}, body: content };
	}

	const rawFm = match[1];
	const body = match[2];
	const frontmatter: Frontmatter = {};

	for (const line of rawFm.split('\n')) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trim();
		if (key) frontmatter[key] = value;
	}

	return { frontmatter, body };
}
