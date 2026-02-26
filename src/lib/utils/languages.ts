const extToLanguage: Record<string, string> = {
	'.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
	'.py': 'Python', '.rs': 'Rust', '.go': 'Go', '.java': 'Java', '.kt': 'Kotlin',
	'.rb': 'Ruby', '.php': 'PHP', '.cs': 'C#', '.cpp': 'C++', '.cc': 'C++', '.c': 'C',
	'.h': 'C', '.hpp': 'C++', '.swift': 'Swift', '.dart': 'Dart', '.scala': 'Scala',
	'.svelte': 'Svelte', '.vue': 'Vue', '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS',
	'.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML', '.toml': 'TOML',
	'.md': 'Markdown', '.sql': 'SQL', '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
	'.lua': 'Lua', '.r': 'R', '.ex': 'Elixir', '.exs': 'Elixir', '.zig': 'Zig',
	'.graphql': 'GraphQL', '.proto': 'Protobuf', '.tf': 'Terraform',
};

export { extToLanguage };

export function getLanguageFromPath(filePath: string): string {
	const match = filePath.match(/(\.[a-zA-Z0-9]+)$/);
	if (!match) return 'Plain Text';
	return extToLanguage[match[1].toLowerCase()] || 'Plain Text';
}

export function getShortFilename(filePath: string): string {
	return filePath.split('/').pop() || filePath;
}
