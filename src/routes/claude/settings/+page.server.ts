import type { PageServerLoad } from './$types';
import { readSettings, readPlugins } from '$lib/server/readers/settings.js';
import { readConfigFiles } from '$lib/server/readers/config-files.js';

export const load: PageServerLoad = async () => {
	const settings = readSettings();
	const plugins = readPlugins();
	const configFiles = readConfigFiles();
	return { settings, plugins, configFiles };
};
