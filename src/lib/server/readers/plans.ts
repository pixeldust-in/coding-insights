import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PLANS_DIR } from '../config.js';

export interface Plan {
	name: string;
	content: string;
}

export function readPlans(): Plan[] {
	try {
		if (!existsSync(PLANS_DIR)) return [];
		const files = readdirSync(PLANS_DIR).filter((f) => f.endsWith('.md'));
		return files.map((file) => ({
			name: file.replace('.md', ''),
			content: readFileSync(join(PLANS_DIR, file), 'utf-8')
		}));
	} catch {
		return [];
	}
}
