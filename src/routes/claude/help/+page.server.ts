import type { PageServerLoad } from './$types';
import { readCliHelp } from '$lib/server/readers/cli-help.js';

export const load: PageServerLoad = async () => {
	return { helpData: readCliHelp('claude') };
};
