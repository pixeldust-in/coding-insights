<script lang="ts">
	let { mediaType, data: base64Data }: { mediaType: string; data: string } = $props();
	let loaded = $state(false);
</script>

<div class="my-2 max-w-lg">
	<img
		src="data:{mediaType};base64,{base64Data}"
		alt="Session content"
		class="rounded-lg border border-border-subtle transition-opacity {loaded ? 'opacity-100' : 'opacity-0'}"
		loading="lazy"
		onload={() => (loaded = true)}
	/>
</div>
