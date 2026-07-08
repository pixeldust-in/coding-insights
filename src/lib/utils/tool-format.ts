/**
 * One-line human-readable summary of a tool call's input.
 * Shared by the conversation ToolCallCard, the print view, and the markdown exporter.
 */
export function formatToolInput(name: string, input: Record<string, unknown>): string {
	if (name === 'Bash' && input.command) return String(input.command).slice(0, 200);
	if (name === 'exec_command' && input.raw) return String(input.raw).slice(0, 200);
	if (name === 'Read' && input.file_path) return String(input.file_path);
	if ((name === 'Write' || name === 'Edit') && input.file_path) return String(input.file_path);
	if (name === 'apply_patch' && input.patch) {
		const patch = String(input.patch);
		const fileMatch = patch.match(/\*\*\* (?:Update|Add|Delete) File:\s*(\S+)/);
		return fileMatch ? fileMatch[1] : 'patch';
	}
	if (name === 'Glob' && input.pattern) return String(input.pattern);
	if (name === 'Grep' && input.pattern) return String(input.pattern);
	return JSON.stringify(input, null, 2).slice(0, 500);
}
