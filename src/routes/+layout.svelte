<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Toaster from '$lib/components/ui/Toaster.svelte';
	import Maintenance from '$lib/components/layout/Maintenance.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const supabase = createSupabaseClient();

	const maintenanceMode = true;

	onMount(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
			if (event !== 'INITIAL_SESSION') {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	{#if maintenanceMode}
		<title>Web fuera de servicio — Brazos Abiertos</title>
	{/if}
	<meta name="description" content="Plataforma de donaciones para ayudar a las víctimas del terremoto de Venezuela 2026. Dona ahora y marca la diferencia." />
	<meta property="og:site_name" content="Brazos Abiertos con Venezuela" />
	<meta property="og:type" content="website" />
</svelte:head>

{#if maintenanceMode}
	<Maintenance />
{:else}
	<div class="app-shell">
		<Header />

		<main class="main-content" id="main-content">
			{@render children()}
		</main>

		<Footer />
	</div>

	<Toaster />
{/if}

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		padding-top: 4.5rem; /* Header height */
	}
</style>
