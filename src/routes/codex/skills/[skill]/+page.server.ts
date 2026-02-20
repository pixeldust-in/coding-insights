import type { PageServerLoad } from './$types';
import { readCodexSkill } from '$lib/server/codex/readers/skills.js';
import { renderMarkdown } from '$lib/server/markdown.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const skill = readCodexSkill(params.skill);
	if (!skill) throw error(404, 'Skill not found');

	const renderedContent = await renderMarkdown(skill.content);
	const renderedSubDocs = await Promise.all(
		skill.subDocs.map(async (doc) => ({
			...doc,
			renderedHtml: await renderMarkdown(doc.content)
		}))
	);

	return {
		skill: {
			...skill,
			renderedHtml: renderedContent,
			subDocs: renderedSubDocs
		}
	};
};
