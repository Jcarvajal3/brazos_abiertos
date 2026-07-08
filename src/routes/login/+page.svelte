<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import logo from '$lib/assets/logo.png';
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
			<img src={logo} alt="Brazos Abiertos con Venezuela" class="login-logo-img" />
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
		background: var(--bg-secondary);
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		pointer-events: none;
	}
	.orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(20,96,154,0.12) 0%, transparent 70%); top: -150px; left: -150px; }
	.orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(27,58,92,0.08) 0%, transparent 70%); bottom: -100px; right: -100px; }

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
		border-radius: 16px;
	}

	.login-logo {
		margin-bottom: var(--space-2);
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.login-logo-img {
		height: 48px;
		width: auto;
		object-fit: contain;
		mix-blend-mode: multiply;
	}

	.login-title {
		font-size: var(--text-2xl);
		font-weight: 800;
		letter-spacing: -0.03em;
		text-align: center;
		color: var(--text-primary);
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
		background: rgba(220, 38, 38, 0.06);
		border: 1px solid rgba(220, 38, 38, 0.2);
		border-radius: 8px;
		color: #dc2626;
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
		color: var(--text-muted);
	}
	.password-wrap .form-input { padding-right: 2.5rem; }

	.login-back {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}
	.login-back a { color: var(--text-muted); transition: color var(--duration-fast); }
	.login-back a:hover { color: var(--text-primary); }
</style>
