<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		rounded?: string;
		class?: string;
	}

	let {
		width = '100%',
		height = '1rem',
		rounded = 'var(--radius-md)',
		class: className = ''
	}: Props = $props();
</script>

<span
	class="skeleton {className}"
	style="width: {width}; height: {height}; border-radius: {rounded}; display: block;"
	aria-hidden="true"
></span>
