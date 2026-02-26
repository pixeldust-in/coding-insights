import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { CODEX_PROMPTS_DIR } from '../config.js';
import { parseFrontmatter } from '../../parsers/frontmatter.js';
import type { Command } from '../../types.js';

export function readCodexCommands(): Command[] {
	try {
		const files = readdirSync(CODEX_PROMPTS_DIR).filter((f) => f.endsWith('.md'));
		return files.map((file) => {
			const raw = readFileSync(join(CODEX_PROMPTS_DIR, file), 'utf-8');
			const { frontmatter, body } = parseFrontmatter(raw);
			return {
				name: file.replace('.md', ''),
				description: frontmatter['description'] || '',
				allowedTools: frontmatter['argument-hint'] || '',
				content: body
			};
		});
	} catch {
		return [];
	}
}
