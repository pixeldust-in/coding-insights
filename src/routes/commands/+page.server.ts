import type { PageServerLoad } from './$types';
import { readCommands } from '$lib/server/readers/commands.js';
import { renderMarkdown } from '$lib/server/markdown.js';

export const load: PageServerLoad = async () => {
	const commands = readCommands();

	const rendered = await Promise.all(
		commands.map(async (cmd) => ({
			...cmd,
			renderedHtml: await renderMarkdown(cmd.content)
		}))
	);

	return { commands: rendered };
};
