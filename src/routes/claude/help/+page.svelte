<script lang="ts">
	import Header from '$components/layout/Header.svelte';
	import HelpPage from '$components/shared/HelpPage.svelte';

	let { data } = $props();
</script>

<Header breadcrumbs={[{ label: 'Help' }]} />

<div class="p-6">
	<HelpPage helpData={data.helpData} />
</div>
