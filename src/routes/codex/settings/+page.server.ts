import type { PageServerLoad } from './$types';
import { readCodexConfig } from '$lib/server/codex/readers/config.js';
import { readCodexConfigFiles } from '$lib/server/codex/readers/config-files.js';

export const load: PageServerLoad = async () => {
	const config = readCodexConfig();
	const configFiles = readCodexConfigFiles();
	return { config, configFiles };
};
