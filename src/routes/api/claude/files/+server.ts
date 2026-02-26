import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeConfigFile } from '$lib/server/readers/config-files.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { filePath, content } = await request.json();

		if (!filePath || typeof content !== 'string') {
			return json({ error: 'filePath and content are required' }, { status: 400 });
		}

		writeConfigFile(filePath, content);
		return json({ success: true });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to save file' },
			{ status: 500 }
		);
	}
};
