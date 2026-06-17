import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { execSync } from 'child_process';

// Anthropic's OAuth usage endpoint is rate-limited by request frequency, so we
// cache the last successful response briefly. Repeated dashboard loads/refreshes
// reuse the cache instead of each hitting the API (which would trip a 429).
const TTL_MS = 60_000;
let cache: { data: Record<string, unknown>; ts: number } | null = null;

export const GET: RequestHandler = async () => {
	// Serve fresh-enough cached usage without calling Anthropic at all.
	if (cache && Date.now() - cache.ts < TTL_MS) {
		return json({ ...cache.data, cachedAgeMs: Date.now() - cache.ts });
	}

	try {
		// Read OAuth token from macOS Keychain
		let credentials: string;
		try {
			credentials = execSync('security find-generic-password -s "Claude Code-credentials" -w', {
				encoding: 'utf-8',
				timeout: 5000
			}).trim();
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
			const retryAfter = Number(response.headers.get('retry-after')) || null;
			const rateLimited = response.status === 429;

			// Fall back to the last known-good usage so the panel stays populated
			// instead of blanking out on a transient throttle.
			if (cache) {
				return json({ ...cache.data, stale: true, rateLimited, retryAfter });
			}
			return json(
				{ error: `API request failed: ${response.status}`, rateLimited, retryAfter },
				{ status: response.status }
			);
		}

		const usage = (await response.json()) as Record<string, unknown>;
		cache = { data: usage, ts: Date.now() };
		return json(usage);
	} catch (err) {
		// Network/other failure — serve stale cache if we have any.
		if (cache) {
			return json({ ...cache.data, stale: true });
		}
		return json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
	}
};
