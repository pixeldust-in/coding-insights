<script lang="ts">
	import '../app.css';
	import Sidebar from '$components/layout/Sidebar.svelte';
	import SearchModal from '$components/layout/SearchModal.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen bg-bg">
	<Sidebar />
	<main class="flex-1 min-w-0 overflow-auto">
		{@render children()}
	</main>
</div>

<SearchModal />
