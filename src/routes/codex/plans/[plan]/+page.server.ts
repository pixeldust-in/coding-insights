import type { PageServerLoad } from './$types';
import { readCodexPlan } from '$lib/server/codex/readers/plans.js';
import { renderMarkdown } from '$lib/server/markdown.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const plan = await readCodexPlan(params.plan);
	if (!plan) throw error(404, 'Plan not found');

	const renderedHtml = await renderMarkdown(plan.content);

	return {
		plan: {
			...plan,
			renderedHtml
		}
	};
};
