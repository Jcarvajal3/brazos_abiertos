<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';

	const statusMessages: Record<number, { title: string; subtitle: string }> = {
		404: {
			title: 'Página no encontrada',
			subtitle: 'La página que buscas no existe o fue movida.'
		},
		403: {
			title: 'Acceso denegado',
			subtitle: 'No tienes permisos para ver este contenido.'
		},
		500: {
			title: 'Error del servidor',
			subtitle: 'Algo falló de nuestro lado. Estamos trabajando para solucionarlo.'
		},
		503: {
			title: 'Servicio no disponible',
			subtitle: 'El servicio está temporalmente fuera de línea. Intenta en unos minutos.'
		}
	};

	const status = $page.status;
	const info = statusMessages[status] ?? {
		title: 'Algo salió mal',
		subtitle: $page.error?.message ?? 'Ocurrió un error inesperado.'
	};
</script>

<svelte:head>
	<title>{status} — Brazos Abiertos con Venezuela</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="error-page">
	<div class="orb orb-1" aria-hidden="true"></div>
	<div class="orb orb-2" aria-hidden="true"></div>

	<div class="error-card glass">

		<div class="error-code">{status}</div>
		<h1 class="error-title">{info.title}</h1>
		<p class="error-subtitle">{info.subtitle}</p>

		{#if $page.error?.message && !statusMessages[status]}
			<div class="error-detail">
				<code>{$page.error.message}</code>
			</div>
		{/if}

		<div class="error-actions">
			<Button href="/" variant="primary" size="lg" id="error-btn-home">
				Ir al inicio
			</Button>
			<Button href="/donar" variant="outline" size="lg" id="error-btn-donate">
				Hacer una donación
			</Button>
		</div>

		<button class="error-back" onclick={() => history.back()} id="error-btn-back">
			← Volver a la página anterior
		</button>
	</div>
</div>

<style>
	:global(body) { overflow: auto !important; }

	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6);
		position: relative;
		overflow: hidden;
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		pointer-events: none;
	}
	.orb-1 {
		width: 600px; height: 600px;
		background: radial-gradient(circle, rgba(20, 96, 154, 0.1) 0%, transparent 70%);
		top: -200px; left: -200px;
	}
	.orb-2 {
		width: 400px; height: 400px;
		background: radial-gradient(circle, rgba(20, 96, 154, 0.06) 0%, transparent 70%);
		bottom: -100px; right: -100px;
	}

	.error-card {
		position: relative;
		z-index: 1;
		max-width: 480px;
		width: 100%;
		padding: var(--space-12) var(--space-10);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		text-align: center;
		animation: scale-in 0.4s var(--ease-out) both;
	}



	.error-code {
		font-family: var(--font-display);
		font-size: var(--text-6xl);
		font-weight: 900;
		letter-spacing: -0.04em;
		background: linear-gradient(135deg, #14609A, #0c3d61);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1;
	}

	.error-title {
		font-size: var(--text-2xl);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.error-subtitle {
		font-size: var(--text-base);
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 360px;
	}

	.error-detail {
		padding: var(--space-3) var(--space-4);
		background: var(--bg-base);
		border: 1px solid var(--border-subtle);
		border-radius: 0;
		width: 100%;
	}
	.error-detail code {
		font-family: monospace;
		font-size: var(--text-xs);
		color: var(--text-muted);
		word-break: break-all;
	}

	.error-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		margin-top: var(--space-2);
	}
	.error-actions :global(.btn) { width: 100%; justify-content: center; }

	.error-back {
		font-size: var(--text-sm);
		color: var(--text-muted);
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-body);
		padding: 0;
		transition: color var(--duration-fast);
	}
	.error-back:hover { color: var(--text-secondary); }
</style>
