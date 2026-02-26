import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import {
	CLAUDE_MD_PATH,
	AGENTS_DIR,
	SETTINGS_PATH,
	SETTINGS_LOCAL_PATH
} from '../config.js';
import type { ConfigFile } from '../types.js';

export function readConfigFiles(): ConfigFile[] {
	const files: ConfigFile[] = [];

	// Global CLAUDE.md
	files.push(readSingleFile(CLAUDE_MD_PATH, 'CLAUDE.md', 'Global instructions for Claude Code'));

	// Agent MD files from ~/.claude/agents/
	if (existsSync(AGENTS_DIR)) {
		try {
			const entries = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
			for (const entry of entries) {
				const filePath = join(AGENTS_DIR, entry);
				files.push(readSingleFile(filePath, `agents/${entry}`, `Agent instructions: ${basename(entry, '.md')}`));
			}
		} catch {
			// ignore
		}
	}

	// settings.json
	files.push(readSingleFile(SETTINGS_PATH, 'settings.json', 'Global Claude Code settings'));

	// settings.local.json
	files.push(readSingleFile(SETTINGS_LOCAL_PATH, 'settings.local.json', 'Local Claude Code settings'));

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

export function writeConfigFile(filePath: string, content: string): void {
	// Only allow writing to known safe paths
	const allowedPaths = [CLAUDE_MD_PATH, SETTINGS_PATH, SETTINGS_LOCAL_PATH];
	const isAgentFile = filePath.startsWith(AGENTS_DIR + '/') && filePath.endsWith('.md');

	if (!allowedPaths.includes(filePath) && !isAgentFile) {
		throw new Error('Writing to this path is not allowed');
	}

	// Ensure parent directory exists
	const dir = filePath.substring(0, filePath.lastIndexOf('/'));
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	writeFileSync(filePath, content, 'utf-8');
}
