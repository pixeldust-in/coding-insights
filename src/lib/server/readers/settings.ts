import { readFileSync, existsSync } from 'fs';
import { SETTINGS_PATH, SETTINGS_LOCAL_PATH, PLUGINS_PATH } from '../config.js';
import type { Settings, Plugin } from '../types.js';

export function readSettings(): { global: Settings; local: Settings } {
	let global: Settings = { permissions: {} };
	let local: Settings = { permissions: {} };

	try {
		if (existsSync(SETTINGS_PATH)) {
			global = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
		}
	} catch {
		// ignore
	}

	try {
		if (existsSync(SETTINGS_LOCAL_PATH)) {
			local = JSON.parse(readFileSync(SETTINGS_LOCAL_PATH, 'utf-8'));
		}
	} catch {
		// ignore
	}

	return { global, local };
}

export function readPlugins(): Plugin[] {
	try {
		if (!existsSync(PLUGINS_PATH)) return [];
		const raw = JSON.parse(readFileSync(PLUGINS_PATH, 'utf-8'));
		const plugins: Plugin[] = [];
		for (const [name, entries] of Object.entries(raw.plugins || {})) {
			const arr = entries as Array<{
				scope: string;
				version: string;
				installedAt: string;
				lastUpdated: string;
			}>;
			for (const entry of arr) {
				plugins.push({
					name,
					scope: entry.scope,
					version: entry.version,
					installedAt: entry.installedAt,
					lastUpdated: entry.lastUpdated
				});
			}
		}
		return plugins;
	} catch {
		return [];
	}
}
