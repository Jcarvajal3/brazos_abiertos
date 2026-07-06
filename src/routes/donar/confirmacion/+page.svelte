<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '$lib/utils/formatters';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const d = data.donation;
	const isManual = d.payment_method !== 'stripe';
	const donorDisplay = d.is_anonymous ? 'Donante anónimo' : (d.donor_name ?? 'Donante anónimo');

	// Handle Stripe redirect: payment may still be processing
	let displayStatus = $state(d.payment_status);

	// If Stripe redirected with redirect_status=succeeded, treat as confirmed
	// even if the webhook hasn't updated the DB yet
	$effect(() => {
		if (data.stripeReturnStatus === 'succeeded' && displayStatus === 'pending') {
			displayStatus = 'processing'; // show "processing" instead of pending for Stripe
		}
	});

	// Confetti burst on confirmed
	let showConfetti = $state(false);
	onMount(() => {
		if (displayStatus === 'confirmed' || data.stripeReturnStatus === 'succeeded') {
			showConfetti = true;
			setTimeout(() => (showConfetti = false), 3000);
		}
	});

	function statusVariant(s: string): 'success' | 'pending' | 'muted' {
		if (s === 'confirmed') return 'success';
		if (s === 'processing') return 'pending';
		return 'pending';
	}
</script>

<svelte:head>
	<title>¡Gracias por tu donación! — Brazos Abiertos con Venezuela</title>
	<meta name="description" content="Tu donación ha sido registrada. Gracias por ayudar a Venezuela." />
</svelte:head>

{#if showConfetti}
	<div class="confetti-overlay" aria-hidden="true">
		{#each Array(30) as _, i}
			<div
				class="confetti-piece"
				style="
					left: {Math.random() * 100}%;
					animation-delay: {Math.random() * 0.8}s;
					background: {['#FF5C10','#FBBF24','#FF7A3A','#FCD34D','#ffffff'][i % 5]};
					width: {6 + Math.random() * 8}px;
					height: {6 + Math.random() * 8}px;
					border-radius: {Math.random() > 0.5 ? '50%' : '2px'};
				"
			></div>
		{/each}
	</div>
{/if}

<div class="confirm-page">
	<div class="container">
		<div class="confirm-card glass animate-scale-in">

			<!-- Success Icon -->
			<div class="success-icon-wrap">
				<div class="success-icon" class:pending={isManual || displayStatus === 'processing'} class:confirmed={displayStatus === 'confirmed' || data.stripeReturnStatus === 'succeeded'}>
					{#if displayStatus === 'confirmed' || data.stripeReturnStatus === 'succeeded'}
						<!-- Checkmark animated -->
						<svg class="check-svg" viewBox="0 0 52 52" width="48" height="48">
							<circle class="check-circle" cx="26" cy="26" r="25" fill="none"/>
							<path class="check-mark" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
						</svg>
					{:else}
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
						</svg>
					{/if}
				</div>
			</div>

			<!-- Main Message -->
			{#if displayStatus === 'confirmed' || data.stripeReturnStatus === 'succeeded'}
				<h1 class="confirm-title">¡Gracias, {donorDisplay}!</h1>
				<p class="confirm-subtitle">Tu donación ha sido procesada exitosamente. 🇻🇪</p>
			{:else if displayStatus === 'processing'}
				<h1 class="confirm-title">Pago en proceso</h1>
				<p class="confirm-subtitle">Tu pago está siendo confirmado. Esto puede tomar unos segundos.</p>
			{:else}
				<h1 class="confirm-title">¡Donación recibida!</h1>
				<p class="confirm-subtitle">Hemos registrado tu donación. Será confirmada al verificar el pago.</p>
			{/if}

			<!-- Donation Summary Card -->
			<div class="summary-card">
				<div class="summary-header">
					<span class="summary-area-icon">{d.area?.icon}</span>
					<div>
						<p class="summary-area-name">{d.area?.name}</p>
						{#if d.project}
							<p class="summary-project-name">{d.project.name} · {d.project.ong_name}</p>
						{:else}
							<p class="summary-project-name">Donación general al área</p>
						{/if}
					</div>
				</div>

				<div class="summary-amount-wrap">
					<span class="summary-amount">{formatCurrency(d.amount, d.currency)}</span>
					<Badge variant={statusVariant(displayStatus)}>
						{displayStatus === 'confirmed' || data.stripeReturnStatus === 'succeeded'
							? '✓ Confirmada'
							: displayStatus === 'processing'
							? '⟳ Procesando'
							: '⏳ Pendiente de verificación'}
					</Badge>
				</div>

				<div class="summary-details">
					<div class="summary-row">
						<span>Método de pago</span>
						<strong>{getPaymentMethodLabel(d.payment_method)}</strong>
					</div>
					<div class="summary-row">
						<span>Donante</span>
						<strong>{donorDisplay}</strong>
					</div>
					<div class="summary-row">
						<span>Fecha</span>
						<strong>{formatDateTime(d.created_at)}</strong>
					</div>
					<div class="summary-row">
						<span>ID de donación</span>
						<code class="donation-id">{d.id.slice(0, 8).toUpperCase()}</code>
					</div>
				</div>

				{#if d.message}
					<div class="donor-message">
						<p class="donor-message-label">Tu mensaje:</p>
						<p class="donor-message-text">"{d.message}"</p>
					</div>
				{/if}
			</div>

			<!-- Manual payment instructions -->
			{#if isManual && displayStatus === 'pending'}
				<div class="manual-notice">
					<div class="manual-notice-icon">⏳</div>
					<div>
						<p class="manual-notice-title">Tu pago está pendiente de verificación</p>
						<p class="manual-notice-text">
							Nuestro equipo verificará tu {d.payment_method === 'pago_movil' ? 'pago móvil' : 'transferencia'} en las próximas <strong>24-48 horas</strong>.
							Recibirás confirmación una vez validado.
						</p>
					</div>
				</div>
			{/if}

			<!-- Stripe processing notice -->
			{#if data.stripeReturnStatus === 'succeeded' && displayStatus !== 'confirmed'}
				<div class="stripe-processing-notice">
					<div class="processing-spinner"></div>
					<p>Confirmando pago con Stripe… esto solo toma unos segundos.</p>
				</div>
			{/if}

			<!-- CTA Actions -->
			<div class="confirm-actions">
				<Button href="/" variant="primary" size="lg" id="btn-back-home">
					🏠 Volver al inicio
				</Button>
				<Button href="/proyectos" variant="outline" size="lg" id="btn-see-projects">
					🏗️ Ver proyectos apoyados
				</Button>
				<Button href="/donar" variant="ghost" size="sm" id="btn-donate-again">
					❤️ Hacer otra donación
				</Button>
			</div>

			<!-- Social share nudge -->
			<div class="share-nudge">
				<p>¿Quieres que más personas ayuden a Venezuela?</p>
				<div class="share-btns">
					<a
						href="https://twitter.com/intent/tweet?text={encodeURIComponent('Acabo de donar a @BrazosAbiertosVE para ayudar a las víctimas del terremoto en Venezuela. ¡Únete! 🇻🇪❤️')}"
						target="_blank"
						rel="noopener noreferrer"
						class="share-btn twitter"
						id="share-twitter"
					>
						𝕏 Twitter
					</a>
					<a
						href="https://wa.me/?text={encodeURIComponent('Acabo de donar a Brazos Abiertos con Venezuela para ayudar a las víctimas del terremoto 🇻🇪❤️ ¡Únete!')}"
						target="_blank"
						rel="noopener noreferrer"
						class="share-btn whatsapp"
						id="share-whatsapp"
					>
						💬 WhatsApp
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.confirm-page {
		padding-block: var(--space-12) var(--space-20);
		min-height: calc(100vh - 4.5rem);
	}

	/* Confetti */
	.confetti-overlay {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 200;
		overflow: hidden;
	}
	.confetti-piece {
		position: absolute;
		top: -20px;
		animation: confetti-fall 2s ease-in forwards;
	}
	@keyframes confetti-fall {
		0% { transform: translateY(0) rotate(0deg); opacity: 1; }
		100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
	}

	.confirm-card {
		max-width: 560px;
		margin: 0 auto;
		padding: var(--space-10) var(--space-8);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		text-align: center;
	}

	/* Success Icon */
	.success-icon-wrap { position: relative; }
	.success-icon {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(251, 191, 36, 0.1);
		border: 2px solid rgba(251, 191, 36, 0.3);
		color: var(--gold-400);
		transition: all 0.4s;
	}
	.success-icon.confirmed {
		background: rgba(34, 197, 94, 0.12);
		border-color: rgba(34, 197, 94, 0.4);
		color: #4ade80;
	}

	/* SVG check animation */
	.check-circle {
		stroke: #4ade80;
		stroke-width: 2;
		stroke-dasharray: 166;
		stroke-dashoffset: 166;
		animation: stroke 0.6s cubic-bezier(0.65,0,.45,1) forwards;
	}
	.check-mark {
		stroke: #4ade80;
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 48;
		stroke-dashoffset: 48;
		animation: stroke 0.3s cubic-bezier(0.65,0,.45,1) 0.6s forwards;
	}
	@keyframes stroke {
		100% { stroke-dashoffset: 0; }
	}

	.confirm-title {
		font-size: clamp(var(--text-2xl), 4vw, var(--text-4xl));
		font-weight: 900;
		letter-spacing: -0.03em;
	}
	.confirm-subtitle { font-size: var(--text-base); color: var(--text-secondary); margin-top: calc(-1 * var(--space-3)); }

	/* Summary Card */
	.summary-card {
		width: 100%;
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		overflow: hidden;
	}
	.summary-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
		background: rgba(255, 92, 16, 0.04);
		text-align: left;
	}
	.summary-area-icon { font-size: 1.75rem; flex-shrink: 0; }
	.summary-area-name { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
	.summary-project-name { font-size: var(--text-sm); color: var(--text-muted); margin-top: 2px; }

	.summary-amount-wrap {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
	}
	.summary-amount {
		font-family: var(--font-display);
		font-size: var(--text-3xl);
		font-weight: 900;
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.summary-details { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); text-align: left; }
	.summary-row { display: flex; justify-content: space-between; font-size: var(--text-sm); }
	.summary-row span { color: var(--text-muted); }
	.summary-row strong { color: var(--text-primary); font-weight: 600; }
	.donation-id { font-family: monospace; font-size: var(--text-xs); background: var(--bg-base); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); }

	.donor-message { padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border-subtle); text-align: left; }
	.donor-message-label { font-size: var(--text-xs); color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: var(--space-2); }
	.donor-message-text { font-size: var(--text-sm); color: var(--text-secondary); font-style: italic; line-height: 1.7; }

	/* Manual notice */
	.manual-notice {
		width: 100%;
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
		padding: var(--space-5);
		background: rgba(251, 191, 36, 0.06);
		border: 1px solid rgba(251, 191, 36, 0.2);
		border-radius: var(--radius-xl);
		text-align: left;
	}
	.manual-notice-icon { font-size: 1.5rem; flex-shrink: 0; }
	.manual-notice-title { font-size: var(--text-sm); font-weight: 700; color: var(--gold-400); margin-bottom: var(--space-1); }
	.manual-notice-text { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.6; }
	.manual-notice-text strong { color: var(--text-primary); }

	/* Stripe processing */
	.stripe-processing-notice {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.processing-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--border-subtle);
		border-top-color: var(--orange-400);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* Actions */
	.confirm-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
	}
	.confirm-actions :global(.btn) { width: 100%; justify-content: center; }

	/* Share */
	.share-nudge { text-align: center; }
	.share-nudge p { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-3); }
	.share-btns { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
	.share-btn {
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 600;
		text-decoration: none;
		transition: all var(--duration-fast) var(--ease-out);
	}
	.share-btn.twitter { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary); }
	.share-btn.twitter:hover { background: rgba(0,0,0,0.7); }
	.share-btn.whatsapp { background: rgba(37, 211, 102, 0.12); border: 1px solid rgba(37, 211, 102, 0.3); color: #4ade80; }
	.share-btn.whatsapp:hover { background: rgba(37, 211, 102, 0.2); }

	@media (max-width: 640px) {
		.confirm-card { padding: var(--space-8) var(--space-5); }
	}
</style>
