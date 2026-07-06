<script lang="ts">
	interface Props {
		variant?: 'orange' | 'gold' | 'success' | 'error' | 'pending' | 'muted';
		class?: string;
		children: import('svelte').Snippet;
	}

	let { variant = 'muted', class: className = '', children }: Props = $props();

	const classes = $derived(['badge', `badge-${variant}`, className].filter(Boolean).join(' '));
</script>

<span class={classes}>
	{@render children()}
</span>
