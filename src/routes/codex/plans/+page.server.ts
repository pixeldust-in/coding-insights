import type { PageServerLoad } from './$types';
import { readCodexPlans } from '$lib/server/codex/readers/plans.js';

export const load: PageServerLoad = async () => {
	const plans = await readCodexPlans();
	return { plans };
};
