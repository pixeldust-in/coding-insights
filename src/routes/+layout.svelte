<script lang="ts">
	import '../app.css';
	import SearchModal from '$components/layout/SearchModal.svelte';

	let { children } = $props();
</script>

{@render children()}

<SearchModal />
