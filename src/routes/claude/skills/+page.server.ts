import type { PageServerLoad } from './$types';
import { readSkills } from '$lib/server/readers/skills.js';

export const load: PageServerLoad = async () => {
	const skills = readSkills();
	return { skills };
};
