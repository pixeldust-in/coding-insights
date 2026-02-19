import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { COMMANDS_DIR } from '../config.js';
import { parseFrontmatter } from '../parsers/frontmatter.js';
import type { Command } from '../types.js';

export function readCommands(): Command[] {
	try {
		const files = readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md'));
		return files.map((file) => {
			const raw = readFileSync(join(COMMANDS_DIR, file), 'utf-8');
			const { frontmatter, body } = parseFrontmatter(raw);
			return {
				name: file.replace('.md', ''),
				description: frontmatter['description'] || '',
				allowedTools: frontmatter['allowed-tools'] || '',
				content: body
			};
		});
	} catch {
		return [];
	}
}

export function getCommand(name: string): Command | undefined {
	return readCommands().find((c) => c.name === name);
}
