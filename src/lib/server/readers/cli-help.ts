import { execSync } from 'child_process';
import type { CliHelpData, CliFlag, CliSubcommand, CliSlashCommand } from '../types.js';

function stripAnsi(str: string): string {
	return str.replace(/\x1b\[[0-9;]*m/g, '');
}

const CLAUDE_SLASH_COMMANDS: CliSlashCommand[] = [
	{ name: 'add-dir', description: 'Add additional directories to the session' },
	{ name: 'clear', description: 'Clear conversation history and free up context' },
	{
		name: 'compact',
		description: 'Summarize conversation history and free up context',
		argument: '[instructions]'
	},
	{ name: 'config', description: 'View or modify configuration' },
	{ name: 'continue', description: 'Continue the most recent conversation' },
	{ name: 'cost', description: 'Show token usage and cost for the current session' },
	{ name: 'doctor', description: 'Check the health of your Claude Code installation' },
	{ name: 'fast', description: 'Toggle fast mode for faster responses' },
	{ name: 'help', description: 'Get help with using Claude Code' },
	{ name: 'init', description: 'Initialize a CLAUDE.md file in the current project' },
	{ name: 'login', description: 'Switch accounts or re-authenticate' },
	{ name: 'logout', description: 'Clear authentication credentials' },
	{ name: 'memory', description: 'Edit CLAUDE.md memory files' },
	{
		name: 'model',
		description: 'Switch the AI model for the current session',
		argument: '[model-name]'
	},
	{ name: 'permissions', description: 'View or update permission rules' },
	{
		name: 'resume',
		description: 'Resume a previous conversation',
		argument: '[session-id]'
	},
	{ name: 'review', description: 'Review a pull request' },
	{ name: 'status', description: 'Show session status and configuration' },
	{ name: 'terminal-setup', description: 'Set up terminal integration and key bindings' }
];

const CODEX_SLASH_COMMANDS: CliSlashCommand[] = [
	{ name: 'apply', description: 'Apply the latest diff produced by Codex as a git apply' },
	{ name: 'clear', description: 'Clear conversation history' },
	{
		name: 'compact',
		description: 'Summarize conversation history and free up context'
	},
	{ name: 'config', description: 'View or modify configuration' },
	{ name: 'diff', description: 'Show the current diff of changes made by Codex' },
	{ name: 'fork', description: 'Branch the current chat into a new thread' },
	{ name: 'history', description: 'Browse previous sessions' },
	{ name: 'login', description: 'Sign in to your account' },
	{ name: 'logout', description: 'Remove stored authentication credentials' },
	{
		name: 'model',
		description: 'Switch models or reasoning effort',
		argument: '[model-name]'
	},
	{
		name: 'resume',
		description: 'Resume a previous session'
	},
	{ name: 'review', description: 'Start a code review of current changes' },
	{ name: 'search', description: 'Search files in the project' },
	{ name: 'status', description: 'Show current model, approvals, and token usage' },
	{ name: 'statusline', description: 'Configure which items appear in the status line' },
	{ name: 'undo', description: 'Undo the last change made by Codex' }
];

function parseClaudeHelp(output: string): Omit<CliHelpData, 'tool'> {
	const lines = output.split('\n');
	let usage = '';
	let description = '';
	const options: CliFlag[] = [];
	const subcommands: CliSubcommand[] = [];

	let section: 'none' | 'arguments' | 'options' | 'commands' = 'none';

	// First line is usage
	for (const line of lines) {
		if (line.startsWith('Usage: ')) {
			usage = line.replace('Usage: ', '').trim();
			break;
		}
	}

	// Description follows usage (before first section header)
	const usageIdx = lines.findIndex((l) => l.startsWith('Usage: '));
	if (usageIdx >= 0) {
		const descLines: string[] = [];
		for (let i = usageIdx + 1; i < lines.length; i++) {
			const line = lines[i];
			if (/^(Arguments|Options|Commands):/.test(line)) break;
			if (line.trim()) descLines.push(line.trim());
		}
		description = descLines.join(' ');
	}

	let currentOption: Partial<CliFlag> | null = null;

	for (const line of lines) {
		// Section headers
		if (line === 'Arguments:') {
			section = 'arguments';
			continue;
		}
		if (line === 'Options:') {
			flushOption();
			section = 'options';
			continue;
		}
		if (line === 'Commands:') {
			flushOption();
			section = 'commands';
			continue;
		}
		if (line.trim() === '') continue;

		if (section === 'options') {
			// Commander.js format: "  -s, --long <arg>  description" or "  --long <arg>  description"
			const optMatch = line.match(
				/^\s{2,}(-\w)?,?\s*(--[\w-]+(?:,\s*--[\w-]+)*)(?:\s+(<[^>]+>|\[[^\]]+\]))?\s{2,}(.+)/
			);
			if (optMatch) {
				flushOption();
				currentOption = {
					short: optMatch[1] || undefined,
					long: optMatch[2],
					argument: optMatch[3] || undefined,
					description: optMatch[4].trim()
				};
			} else if (currentOption && /^\s{30,}/.test(line)) {
				// Continuation line (deeply indented)
				currentOption.description += ' ' + line.trim();
			}
		}

		if (section === 'commands') {
			// Format: "  command-name  description"
			const cmdMatch = line.match(
				/^\s{2,}([\w|]+(?:\s+\[options\])?(?:\s+\[[\w]+\])?)\s{2,}(.+)/
			);
			if (cmdMatch) {
				subcommands.push({
					name: cmdMatch[1].trim(),
					summary: cmdMatch[2].trim()
				});
			}
		}
	}
	flushOption();

	function flushOption() {
		if (currentOption?.long && currentOption?.description) {
			options.push(currentOption as CliFlag);
		}
		currentOption = null;
	}

	return { usage, description, options, subcommands, slashCommands: CLAUDE_SLASH_COMMANDS };
}

function parseCodexHelp(output: string): Omit<CliHelpData, 'tool'> {
	const lines = output.split('\n');
	let usage = '';
	let description = '';
	const options: CliFlag[] = [];
	const subcommands: CliSubcommand[] = [];

	let section: 'none' | 'commands' | 'arguments' | 'options' = 'none';

	// First non-empty line is description, usage lines follow
	const usageLines: string[] = [];
	for (const line of lines) {
		if (line.startsWith('Usage: ')) {
			usageLines.push(line.replace('Usage: ', '').trim());
		}
	}
	usage = usageLines[0] || '';

	// Description is the first line(s) before "Usage:"
	const firstUsageIdx = lines.findIndex((l) => l.startsWith('Usage: '));
	if (firstUsageIdx > 0) {
		const descLines: string[] = [];
		for (let i = 0; i < firstUsageIdx; i++) {
			const trimmed = lines[i].trim();
			if (trimmed && !trimmed.startsWith('If no subcommand')) {
				descLines.push(trimmed);
			}
		}
		description = descLines.join(' ');
	}

	let currentOption: Partial<CliFlag> | null = null;

	for (const line of lines) {
		// Section headers
		if (line === 'Commands:') {
			flushOption();
			section = 'commands';
			continue;
		}
		if (line === 'Arguments:') {
			flushOption();
			section = 'arguments';
			continue;
		}
		if (line === 'Options:') {
			flushOption();
			section = 'options';
			continue;
		}

		if (section === 'commands') {
			// Clap format: "  command-name  Description text"
			const cmdMatch = line.match(/^\s{2,}([\w-]+)\s{2,}(.+)/);
			if (cmdMatch) {
				subcommands.push({
					name: cmdMatch[1].trim(),
					summary: cmdMatch[2].trim().replace(/\s*\[aliases:.*\]/, '')
				});
			}
		}

		if (section === 'options') {
			// Clap format: "  -s, --long-flag <ARG>" or "      --long-flag <ARG>"
			const optMatch = line.match(/^\s{2,}(-\w)?,?\s*(--[\w-]+)(?:\s+(<[^>]+>\.{0,3}))?$/);
			if (optMatch) {
				flushOption();
				currentOption = {
					short: optMatch[1] || undefined,
					long: optMatch[2],
					argument: optMatch[3] || undefined,
					description: ''
				};
				continue;
			}

			// One-line option with description: "  -h, --help   Print help"
			const oneLineMatch = line.match(
				/^\s{2,}(-\w)?,?\s*(--[\w-]+)(?:\s+(<[^>]+>\.{0,3}))?\s{2,}(.+)/
			);
			if (oneLineMatch) {
				flushOption();
				options.push({
					short: oneLineMatch[1] || undefined,
					long: oneLineMatch[2],
					argument: oneLineMatch[3] || undefined,
					description: oneLineMatch[4].trim()
				});
				continue;
			}

			// Description continuation (indented text under an option)
			if (currentOption && /^\s{10,}/.test(line) && line.trim()) {
				if (currentOption.description) {
					currentOption.description += ' ' + line.trim();
				} else {
					currentOption.description = line.trim();
				}
			}
		}
	}
	flushOption();

	function flushOption() {
		if (currentOption?.long && currentOption?.description) {
			options.push(currentOption as CliFlag);
		}
		currentOption = null;
	}

	return { usage, description, options, subcommands, slashCommands: CODEX_SLASH_COMMANDS };
}

export function readCliHelp(tool: 'claude' | 'codex'): CliHelpData {
	try {
		const output = execSync(`${tool} --help`, {
			timeout: 5000,
			encoding: 'utf-8',
			env: { ...process.env, NO_COLOR: '1' },
			stdio: ['pipe', 'pipe', 'pipe']
		});

		const cleaned = stripAnsi(output);
		const parsed = tool === 'claude' ? parseClaudeHelp(cleaned) : parseCodexHelp(cleaned);

		return { tool, ...parsed };
	} catch {
		return {
			tool,
			usage: '',
			description: '',
			options: [],
			subcommands: [],
			slashCommands: tool === 'claude' ? CLAUDE_SLASH_COMMANDS : CODEX_SLASH_COMMANDS,
			error: `${tool} CLI not found. Make sure it is installed and available in your PATH.`
		};
	}
}
