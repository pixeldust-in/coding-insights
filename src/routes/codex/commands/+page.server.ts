import type { PageServerLoad } from './$types';
import { readCodexCommands } from '$lib/server/codex/readers/commands.js';
import { renderMarkdown } from '$lib/server/markdown.js';

export const load: PageServerLoad = async () => {
	const commands = readCodexCommands();

	const rendered = await Promise.all(
		commands.map(async (cmd) => ({
			...cmd,
			renderedHtml: await renderMarkdown(cmd.content)
		}))
	);

	return { commands: rendered };
};
