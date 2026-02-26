import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { CODEX_CONFIG_PATH } from '../config.js';
import type { ConfigFile } from '../../types.js';

export function readCodexConfigFiles(): ConfigFile[] {
	const files: ConfigFile[] = [];

	// Codex config.toml
	files.push(readSingleFile(CODEX_CONFIG_PATH, 'config.toml', 'Codex CLI configuration'));

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
	if (filePath !== CODEX_CONFIG_PATH) {
		throw new Error('Writing to this path is not allowed');
	}

	const dir = filePath.substring(0, filePath.lastIndexOf('/'));
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	writeFileSync(filePath, content, 'utf-8');
}
