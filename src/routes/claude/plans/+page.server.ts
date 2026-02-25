import type { PageServerLoad } from './$types';
import { readPlans } from '$lib/server/readers/plans.js';

export const load: PageServerLoad = async () => {
	const plans = readPlans();
	return { plans };
};
