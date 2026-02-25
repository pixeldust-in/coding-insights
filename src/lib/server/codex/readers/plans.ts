import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { findAllSessionFiles } from './sessions.js';
import type { CodexPlan } from '../types.js';

let cachedPlans: CodexPlan[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000;

interface CodexLine {
	timestamp: string;
	type: string;
	payload: Record<string, unknown>;
}

function extractTitle(content: string): string {
	const match = content.match(/^#{1,3}\s+(?:Plan:\s*)?(.+)/m);
	return match ? match[1].trim() : 'Untitled Plan';
}

function extractPreview(content: string): string {
	const withoutHeading = content.replace(/^#{1,3}\s[^\n]*\n*/, '');
	const firstParagraph = withoutHeading.trim().split(/\n\n/)[0] || '';
	const clean = firstParagraph.replace(/^#+\s*/gm, '').replace(/\n/g, ' ').trim();
	return clean.length > 200 ? clean.slice(0, 200) + '…' : clean;
}

async function extractPlansFromFile(filePath: string): Promise<CodexPlan[]> {
	const plans: CodexPlan[] = [];

	const rl = createInterface({
		input: createReadStream(filePath, { encoding: 'utf-8' }),
		crlfDelay: Infinity
	});

	let sessionId = '';
	let cwd = '';
	let planIndex = 0;

	for await (const line of rl) {
		if (!line.trim()) continue;

		let parsed: CodexLine;
		try {
			parsed = JSON.parse(line);
		} catch {
			continue;
		}

		// Extract session meta
		if (parsed.type === 'session_meta' && !sessionId) {
			const p = parsed.payload;
			sessionId = (p.id as string) || '';
			cwd = (p.cwd as string) || '';
		}

		// Only look at assistant messages for proposed_plan blocks
		if (parsed.type !== 'response_item') continue;
		const payload = parsed.payload;
		if (payload.type !== 'message' || payload.role !== 'assistant') continue;

		const content = payload.content as Array<{ type: string; text?: string }> | undefined;
		if (!content) continue;

		for (const block of content) {
			if (block.type !== 'output_text' || !block.text) continue;

			// Extract all <proposed_plan> blocks from this text
			const regex = /<proposed_plan>([\s\S]*?)<\/proposed_plan>/g;
			let match;
			while ((match = regex.exec(block.text)) !== null) {
				const planContent = match[1].trim();
				if (!planContent) continue;

				const projectName = cwd.split('/').filter(Boolean).pop() || cwd;
				plans.push({
					id: `${sessionId}-plan-${planIndex}`,
					title: extractTitle(planContent),
					content: planContent,
					preview: extractPreview(planContent),
					sessionId,
					timestamp: parsed.timestamp,
					projectName
				});
				planIndex++;
			}
		}
	}

	return plans;
}

export async function readCodexPlans(): Promise<CodexPlan[]> {
	const now = Date.now();
	if (cachedPlans && now - cacheTime < CACHE_TTL) {
		return cachedPlans;
	}

	const files = findAllSessionFiles();
	const allPlans: CodexPlan[] = [];

	for (const filePath of files) {
		const plans = await extractPlansFromFile(filePath);
		allPlans.push(...plans);
	}

	// Sort by timestamp descending
	allPlans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	cachedPlans = allPlans;
	cacheTime = now;
	return allPlans;
}

export async function readCodexPlan(id: string): Promise<CodexPlan | null> {
	const plans = await readCodexPlans();
	return plans.find((p) => p.id === id) || null;
}
