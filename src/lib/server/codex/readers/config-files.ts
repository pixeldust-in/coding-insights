import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { CODEX_CONFIG_PATH, CODEX_AGENTS_MD_PATH, CODEX_RULES_DIR } from '../config.js';
import type { ConfigFile } from '../../types.js';

export function readCodexConfigFiles(): ConfigFile[] {
	const files: ConfigFile[] = [];

	// Codex config.toml
	files.push(readSingleFile(CODEX_CONFIG_PATH, 'config.toml', 'Codex CLI configuration'));

	// Global AGENTS.md
	files.push(readSingleFile(CODEX_AGENTS_MD_PATH, 'AGENTS.md', 'Global instructions for Codex CLI'));

	// Rules files from ~/.codex/rules/
	if (existsSync(CODEX_RULES_DIR)) {
		try {
			const entries = readdirSync(CODEX_RULES_DIR).filter(
				(f) => f.endsWith('.rules') || f.endsWith('.md')
			);
			for (const entry of entries) {
				const filePath = join(CODEX_RULES_DIR, entry);
				files.push(
					readSingleFile(filePath, `rules/${entry}`, `Rule file: ${basename(entry, '.rules')}`)
				);
			}
		} catch {
			// ignore
		}
	}

	return files;
}

function readSingleFile(filePath: string, displayName: string, description: string): ConfigFile {
	let content = '';
	let exists = false;

	try {
		if (existsSync(filePath)) {
			content = readFileSync(filePath, 'utf-8');
			exists = true;
		}
	} catch {
		// ignore
	}

	return { filePath, displayName, description, content, exists };
}

export function writeCodexConfigFile(filePath: string, content: string): void {
	const allowedPaths = [CODEX_CONFIG_PATH, CODEX_AGENTS_MD_PATH];
	const isRuleFile =
		filePath.startsWith(CODEX_RULES_DIR + '/') &&
		(filePath.endsWith('.rules') || filePath.endsWith('.md'));

	if (!allowedPaths.includes(filePath) && !isRuleFile) {
		throw new Error('Writing to this path is not allowed');
	}

	const dir = filePath.substring(0, filePath.lastIndexOf('/'));
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	writeFileSync(filePath, content, 'utf-8');
}
