<script lang="ts">
	interface Props {
		variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		href?: string;
		class?: string;
		id?: string;
		onclick?: (e: MouseEvent) => void;
		children: import('svelte').Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		href,
		class: className = '',
		id,
		onclick,
		children
	}: Props = $props();

	const sizeClass = $derived({ sm: 'btn-sm', md: '', lg: 'btn-lg', xl: 'btn-xl' }[size]);
	const variantClass = $derived(`btn-${variant}`);
	const classes = $derived(
		['btn', variantClass, sizeClass, loading ? 'btn-loading' : '', className]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href}
	<a {href} {id} class={classes} role="button">
		{@render children()}
	</a>
{:else}
	<button
		{type}
		{id}
		{disabled}
		class={classes}
		{onclick}
		aria-busy={loading}
	>
		{@render children()}
	</button>
{/if}
