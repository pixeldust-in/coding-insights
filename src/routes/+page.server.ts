import type { PageServerLoad } from './$types';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const load: PageServerLoad = async () => {
	const claudeDir = join(homedir(), '.claude');
	const codexDir = join(homedir(), '.codex');

	return {
		claudeAvailable: existsSync(claudeDir),
		codexAvailable: existsSync(codexDir)
	};
};
