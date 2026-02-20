import type { PageServerLoad } from './$types';
import { readCodexSkills } from '$lib/server/codex/readers/skills.js';

export const load: PageServerLoad = async () => {
	const skills = readCodexSkills();
	return { skills };
};
