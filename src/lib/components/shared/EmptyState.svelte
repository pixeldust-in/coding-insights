<script lang="ts">
	let { message = 'No data available' }: { message?: string } = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 text-text-muted">
	<span class="text-3xl mb-3">∅</span>
	<p class="text-sm">{message}</p>
</div>
