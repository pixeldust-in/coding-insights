<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = 'Search...',
		class: className = ''
	}: {
		value?: string;
		placeholder?: string;
		class?: string;
	} = $props();
</script>

<div class="terminal-search {className}">
	<span class="prompt">&gt;</span>
	<input
		type="text"
		bind:value
		{placeholder}
	/>
	<svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="11" cy="11" r="8"/>
		<line x1="21" y1="21" x2="16.65" y2="16.65"/>
	</svg>
</div>
