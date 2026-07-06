<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Iniciar sesión — Brazos Abiertos con Venezuela</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="login-page">
	<!-- Background orbs -->
	<div class="orb orb-1" aria-hidden="true"></div>
	<div class="orb orb-2" aria-hidden="true"></div>

	<div class="login-card glass">
		<!-- Logo -->
		<div class="login-logo">
			<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
				<rect width="40" height="40" rx="10" fill="#090910"/>
				<path d="M6 24C6 14 13 11 20 11C27 11 34 14 34 24" stroke="url(#l1)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
				<path d="M20 28L13 21C11 19 11 16 13 14C15 12 18 13 20 15C22 13 25 12 27 14C29 16 29 19 27 21Z" fill="url(#l2)"/>
				<defs>
					<linearGradient id="l1" x1="6" y1="24" x2="34" y2="11" gradientUnits="userSpaceOnUse">
						<stop stop-color="#FF5C10"/><stop offset="1" stop-color="#FBBF24"/>
					</linearGradient>
					<linearGradient id="l2" x1="13" y1="12" x2="27" y2="28" gradientUnits="userSpaceOnUse">
						<stop stop-color="#FF5C10"/><stop offset="1" stop-color="#FBBF24"/>
					</linearGradient>
				</defs>
			</svg>
		</div>

		<h1 class="login-title">Panel de administración</h1>
		<p class="login-subtitle">Acceso exclusivo para administradores</p>

		{#if form?.error}
			<div class="login-error" role="alert">
				⚠ {form.error}
			</div>
		{/if}

		<form
			method="POST"
			class="login-form"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
		>
			<div class="form-group">
				<label class="form-label" for="login-email">Correo electrónico</label>
				<input
					id="login-email"
					name="email"
					type="email"
					class="form-input"
					placeholder="admin@ejemplo.com"
					value={form?.email ?? ''}
					required
					autocomplete="email"
				/>
			</div>

			<div class="form-group">
				<label class="form-label" for="login-password">Contraseña</label>
				<div class="password-wrap">
					<input
						id="login-password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						class="form-input"
						placeholder="••••••••"
						required
						autocomplete="current-password"
					/>
					<button
						type="button"
						class="password-toggle"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
					>
						{showPassword ? '🙈' : '👁️'}
					</button>
				</div>
			</div>

			<Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting}>
				{#if submitting}
					Verificando…
				{:else}
					🔐 Iniciar sesión
				{/if}
			</Button>
		</form>

		<p class="login-back">
			<a href="/">← Volver al sitio público</a>
		</p>
	</div>
</div>

<style>
	:global(body) { background: var(--bg-base); }

	.login-page {
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
		filter: blur(80px);
		pointer-events: none;
	}
	.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(255,92,16,0.15) 0%, transparent 70%); top: -150px; left: -150px; }
	.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%); bottom: -100px; right: -100px; }

	.login-card {
		width: 100%;
		max-width: 420px;
		padding: var(--space-10);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
		position: relative;
		z-index: 1;
		animation: scale-in 0.4s var(--ease-out) both;
	}

	.login-logo { margin-bottom: var(--space-2); }

	.login-title {
		font-size: var(--text-2xl);
		font-weight: 800;
		letter-spacing: -0.03em;
		text-align: center;
	}

	.login-subtitle {
		font-size: var(--text-sm);
		color: var(--text-muted);
		text-align: center;
		margin-top: calc(-1 * var(--space-3));
	}

	.login-error {
		width: 100%;
		padding: var(--space-3) var(--space-4);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		color: #f87171;
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	.login-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.login-form :global(.btn) { width: 100%; justify-content: center; }

	.password-wrap { position: relative; }
	.password-toggle {
		position: absolute;
		right: var(--space-3);
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: var(--space-1);
	}
	.password-wrap .form-input { padding-right: 2.5rem; }

	.login-back {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}
	.login-back a { color: var(--text-muted); transition: color var(--duration-fast); }
	.login-back a:hover { color: var(--text-primary); }
</style>
