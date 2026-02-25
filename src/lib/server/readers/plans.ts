import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { PLANS_DIR } from '../config.js';

export interface Plan {
	name: string;
	title: string;
	content: string;
	preview: string;
	modifiedAt: string;
}

function extractTitle(content: string, filename: string): string {
	const match = content.match(/^#{1,3}\s+(?:Plan:\s*)?(.+)/m);
	if (match) return match[1].trim();
	// Humanize filename: "noble-tickling-stroustrup" → "Noble Tickling Stroustrup"
	return filename
		.replace(/[-_]/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractPreview(content: string): string {
	// Strip first heading line, then take first paragraph up to 200 chars
	const withoutHeading = content.replace(/^#{1,3}\s[^\n]*\n*/, '');
	const firstParagraph = withoutHeading.trim().split(/\n\n/)[0] || '';
	const clean = firstParagraph.replace(/^#+\s*/gm, '').replace(/\n/g, ' ').trim();
	return clean.length > 200 ? clean.slice(0, 200) + '…' : clean;
}

function parsePlan(file: string): Plan {
	const filePath = join(PLANS_DIR, file);
	const content = readFileSync(filePath, 'utf-8');
	const name = file.replace('.md', '');
	const stats = statSync(filePath);

	return {
		name,
		title: extractTitle(content, name),
		content,
		preview: extractPreview(content),
		modifiedAt: stats.mtime.toISOString()
	};
}

export function readPlans(): Plan[] {
	try {
		if (!existsSync(PLANS_DIR)) return [];
		const files = readdirSync(PLANS_DIR).filter((f) => f.endsWith('.md'));
		return files.map(parsePlan).sort(
			(a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
		);
	} catch {
		return [];
	}
}

export function readPlan(name: string): Plan | null {
	try {
		const filePath = join(PLANS_DIR, `${name}.md`);
		if (!existsSync(filePath)) return null;
		return parsePlan(`${name}.md`);
	} catch {
		return null;
	}
}
