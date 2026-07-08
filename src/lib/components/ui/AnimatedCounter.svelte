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
	let pulsing = $state(false);
	let prevValue = $state(0);

	onMount(() => {
		mounted = true;
		prevValue = value;
		counter.set(value);
	});

	// React to value changes after mount — trigger pulse animation when value increases
	$effect(() => {
		if (mounted) {
			if (value !== prevValue) {
				// Trigger pulse when value changes (especially increases)
				if (value > prevValue) {
					pulsing = true;
					setTimeout(() => (pulsing = false), 800);
				}
				prevValue = value;
			}
			counter.set(value);
		}
	});
</script>

<span class="animated-counter {className}" class:pulse={pulsing} aria-live="polite" aria-atomic="true">
	{format($counter)}
</span>

<style>
	.animated-counter {
		display: inline-block;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.animated-counter.pulse {
		animation: counter-pulse 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes counter-pulse {
		0% {
			transform: scale(1);
			filter: brightness(1);
		}
		15% {
			transform: scale(1.12);
			filter: brightness(1.4);
		}
		30% {
			transform: scale(0.97);
			filter: brightness(1.15);
		}
		50% {
			transform: scale(1.05);
			filter: brightness(1.25);
		}
		100% {
			transform: scale(1);
			filter: brightness(1);
		}
	}
</style>
