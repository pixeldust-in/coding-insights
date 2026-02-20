<script lang="ts">
	let {
		value = $bindable(''),
		options,
		class: className = ''
	}: {
		value?: string;
		options: { value: string; label: string }[];
		class?: string;
	} = $props();

	let open = $state(false);
	let buttonEl = $state<HTMLButtonElement | null>(null);

	let selectedLabel = $derived(
		options.find((o) => o.value === value)?.label ?? ''
	);

	function select(val: string) {
		value = val;
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			buttonEl?.focus();
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (buttonEl && !buttonEl.parentElement?.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="terminal-select {className}">
	<button
		bind:this={buttonEl}
		class="terminal-select-trigger"
		onclick={() => (open = !open)}
		aria-expanded={open}
		aria-haspopup="listbox"
		type="button"
	>
		<span class="terminal-select-value">{selectedLabel}</span>
		<svg class="terminal-select-chevron" class:open viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4 6l4 4 4-4" />
		</svg>
	</button>

	{#if open}
		<div class="terminal-select-dropdown" role="listbox">
			{#each options as opt}
				<button
					class="terminal-select-option"
					class:selected={opt.value === value}
					role="option"
					aria-selected={opt.value === value}
					onclick={() => select(opt.value)}
					type="button"
				>
					{opt.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
