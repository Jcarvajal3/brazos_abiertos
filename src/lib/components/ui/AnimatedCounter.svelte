<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	interface Props {
		value: number;
		duration?: number;
		format?: (v: number) => string;
		class?: string;
	}

	let {
		value,
		duration = 1200,
		format = (v) => Math.round(v).toLocaleString('es-VE'),
		class: className = ''
	}: Props = $props();

	const counter = tweened(0, { duration, easing: cubicOut });
	let mounted = false;

	onMount(() => {
		mounted = true;
		counter.set(value);
	});

	// React to value changes after mount
	$effect(() => {
		if (mounted) counter.set(value);
	});
</script>

<span class={className} aria-live="polite" aria-atomic="true">
	{format($counter)}
</span>
