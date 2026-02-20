/**
 * Lightweight TOML parser for Codex config.toml.
 * Handles key-value pairs, quoted strings, table sections, and inline tables.
 */
export function parseTOML(input: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	let currentTable: Record<string, unknown> = result;
	let currentPath: string[] = [];

	for (const rawLine of input.split('\n')) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		// Table header: [section.name]
		const tableMatch = line.match(/^\[([^\]]+)\]$/);
		if (tableMatch) {
			currentPath = tableMatch[1].split('.').map((s) => s.trim().replace(/^"|"$/g, ''));
			currentTable = result;
			for (const part of currentPath) {
				if (!(part in currentTable) || typeof currentTable[part] !== 'object') {
					currentTable[part] = {};
				}
				currentTable = currentTable[part] as Record<string, unknown>;
			}
			continue;
		}

		// Key-value pair
		const kvMatch = line.match(/^([^=]+?)\s*=\s*(.+)$/);
		if (kvMatch) {
			const key = kvMatch[1].trim().replace(/^"|"$/g, '');
			const rawValue = kvMatch[2].trim();
			currentTable[key] = parseValue(rawValue);
		}
	}

	return result;
}

function parseValue(raw: string): unknown {
	// Quoted string
	if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
		return raw.slice(1, -1);
	}
	// Boolean
	if (raw === 'true') return true;
	if (raw === 'false') return false;
	// Number
	if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
	// Array
	if (raw.startsWith('[') && raw.endsWith(']')) {
		const inner = raw.slice(1, -1).trim();
		if (!inner) return [];
		return inner.split(',').map((s) => parseValue(s.trim()));
	}
	return raw;
}
