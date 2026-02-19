import { marked } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['github-dark', 'github-light'],
			langs: [
				'javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css',
				'svelte', 'markdown', 'yaml', 'sql', 'go', 'rust', 'java', 'c',
				'cpp', 'ruby', 'php', 'swift', 'kotlin', 'shell', 'diff', 'jsx', 'tsx'
			]
		});
	}
	return highlighterPromise;
}

export async function renderMarkdown(content: string): Promise<string> {
	const hl = await getHighlighter();

	marked.setOptions({
		gfm: true,
		breaks: false
	});

	const renderer = new marked.Renderer();
	renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
		const language = lang || 'text';
		try {
			if (hl.getLoadedLanguages().includes(language)) {
				return hl.codeToHtml(text, {
					lang: language,
					themes: { dark: 'github-dark', light: 'github-light' },
					defaultColor: false
				});
			}
		} catch {
			// Fall through to plain text
		}
		return `<pre class="shiki"><code>${escapeHtml(text)}</code></pre>`;
	};

	return marked(content, { renderer }) as string;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
