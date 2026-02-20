import type { PageServerLoad } from './$types';
import { listProjects, getProjectDisplayName } from '$lib/server/readers/projects.js';

export const load: PageServerLoad = async () => {
	const projects = listProjects();
	return {
		projects: projects.map((p) => ({
			...p,
			displayName: getProjectDisplayName(p.dirName)
		}))
	};
};
