<script lang="ts">
	let {
		variant = 'default',
		children
	}: {
		variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
		children: import('svelte').Snippet;
	} = $props();

	const variantClasses: Record<string, string> = {
		default: 'bg-surface-hover text-text-secondary',
		accent: 'bg-accent/15 text-accent',
		success: 'bg-success/15 text-success',
		warning: 'bg-warning/15 text-warning',
		error: 'bg-error/15 text-error'
	};
</script>

<span
	class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium {variantClasses[variant]}"
>
	{@render children()}
</span>
