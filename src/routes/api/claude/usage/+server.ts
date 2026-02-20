import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { execSync } from 'child_process';

export const GET: RequestHandler = async () => {
	try {
		// Read OAuth token from macOS Keychain
		let credentials: string;
		try {
			credentials = execSync(
				'security find-generic-password -s "Claude Code-credentials" -w',
				{ encoding: 'utf-8', timeout: 5000 }
			).trim();
		} catch {
			return json({ error: 'Could not read OAuth token from Keychain' }, { status: 401 });
		}

		// Parse the credentials JSON to extract the access token
		let accessToken: string;
		try {
			const parsed = JSON.parse(credentials);
			accessToken = parsed.claudeAiOauth?.accessToken;
			if (!accessToken) {
				return json({ error: 'No access token found in credentials' }, { status: 401 });
			}
		} catch {
			return json({ error: 'Failed to parse Keychain credentials' }, { status: 401 });
		}

		// Fetch usage data from Anthropic API
		const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'anthropic-beta': 'oauth-2025-04-20',
				'User-Agent': 'claude-code/2.1.49'
			}
		});

		if (!response.ok) {
			return json(
				{ error: `API request failed: ${response.status}` },
				{ status: response.status }
			);
		}

		const usage = await response.json();
		return json(usage);
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
