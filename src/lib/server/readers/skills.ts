import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { SKILLS_DIR } from '../config.js';
import { parseFrontmatter } from '../parsers/frontmatter.js';
import type { Skill } from '../types.js';

export function readSkills(): Skill[] {
	try {
		const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
		return dirs.map((d) => readSkill(d.name)).filter(Boolean) as Skill[];
	} catch {
		return [];
	}
}

export function readSkill(dirName: string): Skill | null {
	const skillDir = join(SKILLS_DIR, dirName);
	const skillMdPath = join(skillDir, 'SKILL.md');

	if (!existsSync(skillMdPath)) return null;

	const raw = readFileSync(skillMdPath, 'utf-8');
	const { frontmatter, body } = parseFrontmatter(raw);

	// Read sub-documents (all .md files except SKILL.md and CLAUDE.md)
	const subDocs: { name: string; content: string }[] = [];
	try {
		const files = readdirSync(skillDir).filter(
			(f) => f.endsWith('.md') && f !== 'SKILL.md' && f !== 'CLAUDE.md'
		);
		for (const file of files) {
			const content = readFileSync(join(skillDir, file), 'utf-8');
			subDocs.push({ name: file.replace('.md', ''), content });
		}
	} catch {
		// skip
	}

	return {
		name: frontmatter['name'] || dirName,
		dirName,
		description: frontmatter['description'] || '',
		content: body,
		subDocs
	};
}
