<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	interface SearchResult {
		type: 'session' | 'command' | 'project';
		title: string;
		subtitle: string;
		href: string;
	}

	let open = $state(false);
	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let selectedIndex = $state(0);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	let activeTool = $derived(
		page.url.pathname.startsWith('/claude') ? 'claude' :
		page.url.pathname.startsWith('/codex') ? 'codex' :
		null
	);

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = !open;
			if (open) {
				query = '';
				results = [];
				selectedIndex = 0;
			}
		}
		if (e.key === 'Escape') {
			open = false;
		}
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && results[selectedIndex]) {
			e.preventDefault();
			navigate(results[selectedIndex].href);
		}
	}

	function navigate(href: string) {
		open = false;
		goto(href);
	}

	async function search(q: string) {
		if (q.length < 2 || !activeTool) {
			results = [];
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/${activeTool}/search?q=${encodeURIComponent(q)}`);
			const data = await res.json();
			results = data.results;
			selectedIndex = 0;
		} catch {
			results = [];
		}
		loading = false;
	}

	$effect(() => {
		const q = query; // read synchronously so $effect tracks this dependency
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => search(q), 200);
	});

	const typeIcons: Record<string, string> = {
		session: '~',
		command: '/',
		project: '>'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
		onclick={() => (open = false)}
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
		role="button"
		tabindex="-1"
	></div>

	<!-- Modal -->
	<div class="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
		<div class="bg-surface border border-accent/40 rounded-xl shadow-2xl overflow-hidden" style="box-shadow: 0 0 0 1px var(--color-accent-muted), 0 0 24px var(--color-accent-glow), 0 25px 50px rgba(0,0,0,0.3);">
			<!-- Terminal-style Input -->
			<div class="flex items-center gap-3 px-4 border-b border-border-subtle">
				<span class="text-accent font-mono font-semibold text-sm">&gt;</span>
				<input
					type="text"
					bind:value={query}
					onkeydown={handleInputKeydown}
					placeholder={activeTool ? `Search ${activeTool} sessions, commands, projects...` : 'Search...'}
					class="flex-1 bg-transparent py-3 text-sm text-text font-mono placeholder:text-text-muted focus:outline-none"
					autofocus
				/>
				{#if loading}
					<span class="text-xs text-accent animate-pulse font-mono">...</span>
				{:else}
					<svg class="w-4 h-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"/>
						<line x1="21" y1="21" x2="16.65" y2="16.65"/>
					</svg>
				{/if}
			</div>

			<!-- Results -->
			{#if results.length > 0}
				<div class="max-h-80 overflow-y-auto py-2">
					{#each results as result, i}
						<button
							onclick={() => navigate(result.href)}
							class="w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors cursor-pointer
								{i === selectedIndex ? 'bg-accent/10 text-accent' : 'hover:bg-surface-hover'}"
						>
							<span class="text-xs font-mono text-accent/60">{typeIcons[result.type] || '.'}</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm">{result.title}</p>
								<p class="truncate text-xs text-text-muted">{result.subtitle}</p>
							</div>
							<span
								class="text-[10px] uppercase text-text-muted bg-surface-hover px-1.5 py-0.5 rounded font-mono"
							>
								{result.type}
							</span>
						</button>
					{/each}
				</div>
			{:else if query.length >= 2 && !loading}
				<div class="py-8 text-center text-sm text-text-muted">No results found</div>
			{/if}

			<!-- Footer -->
			<div
				class="flex items-center justify-between px-4 py-2 border-t border-border-subtle text-[10px] text-text-muted font-mono"
			>
				<span>↑↓ navigate</span>
				<span>↵ open</span>
				<span>esc close</span>
			</div>
		</div>
	</div>
{/if}
