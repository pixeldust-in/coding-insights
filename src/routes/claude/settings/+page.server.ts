import type { PageServerLoad } from './$types';
import { readSettings, readPlugins } from '$lib/server/readers/settings.js';

export const load: PageServerLoad = async () => {
	const settings = readSettings();
	const plugins = readPlugins();
	return { settings, plugins };
};
