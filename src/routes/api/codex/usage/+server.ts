import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readCodexUsage } from '$lib/server/codex/readers/usage.js';

export const GET: RequestHandler = async () => {
	try {
		const usage = readCodexUsage();
		return json(usage);
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
