<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/dynamic/public';
	import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

	interface Props {
		clientSecret: string;
		donationId: string;
		amount: number;
		onSuccess: (paymentIntentId: string) => void;
		onError: (msg: string) => void;
	}

	let { clientSecret, donationId, amount, onSuccess, onError }: Props = $props();

	let stripe = $state<Stripe | null>(null);
	let elements = $state<StripeElements | null>(null);
	let paymentElement = $state<StripePaymentElement | null>(null);
	let mountEl = $state<HTMLElement | null>(null);
	let loading = $state(true);
	let submitting = $state(false);
	let stripeError = $state('');
	let ready = $state(false);

	onMount(async () => {
		if (!PUBLIC_STRIPE_PUBLISHABLE_KEY || PUBLIC_STRIPE_PUBLISHABLE_KEY === 'pk_test_placeholder') {
			onError('Stripe no está configurado con clave real. Usa Pago Móvil o Transferencia.');
			loading = false;
			return;
		}

		try {
			const { loadStripe } = await import('@stripe/stripe-js');
			stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

			if (!stripe) {
				onError('No se pudo cargar Stripe. Verifica tu conexión.');
				loading = false;
				return;
			}

			elements = stripe.elements({
				clientSecret,
				appearance: {
					theme: 'night',
					variables: {
						colorPrimary: '#FF5C10',
						colorBackground: '#181828',
						colorText: '#f8f9fc',
						colorDanger: '#f87171',
						colorTextSecondary: '#a8b0c0',
						borderRadius: '10px',
						fontFamily: 'Inter, system-ui, sans-serif',
						fontSizeBase: '15px',
						spacingUnit: '4px',
						focusBoxShadow: '0 0 0 3px rgba(255, 92, 16, 0.25)'
					},
					rules: {
						'.Input': {
							border: '1px solid rgba(255,255,255,0.1)',
							backgroundColor: '#1a1a2e',
							padding: '12px 14px'
						},
						'.Input:focus': {
							border: '1px solid rgba(255,92,16,0.6)',
							boxShadow: '0 0 0 3px rgba(255,92,16,0.15)'
						},
						'.Label': {
							color: '#a8b0c0',
							fontWeight: '600',
							fontSize: '13px',
							textTransform: 'uppercase',
							letterSpacing: '0.06em',
							marginBottom: '6px'
						},
						'.Tab': {
							border: '1px solid rgba(255,255,255,0.07)',
							backgroundColor: '#181828'
						},
						'.Tab--selected': {
							border: '1px solid rgba(255,92,16,0.5)',
							backgroundColor: 'rgba(255,92,16,0.08)',
							color: '#FF7A3A'
						},
						'.Error': { color: '#f87171' }
					}
				},
				locale: 'es'
			});

			paymentElement = elements.create('payment', {
				layout: { type: 'accordion', defaultCollapsed: false }
			});

			if (mountEl) {
				paymentElement.mount(mountEl);
				paymentElement.on('ready', () => { loading = false; ready = true; });
				paymentElement.on('loaderror', (e) => {
					loading = false;
					onError(e.error?.message ?? 'Error al cargar el formulario de pago');
				});
			}
		} catch (err: any) {
			console.error('Stripe init error:', err);
			onError('No se pudo iniciar el formulario de pago. ' + (err?.message ?? ''));
			loading = false;
		}
	});

	onDestroy(() => {
		paymentElement?.unmount();
	});

	export async function confirmPayment() {
		if (!stripe || !elements || !ready) return;
		stripeError = '';
		submitting = true;

		const returnUrl = `${window.location.origin}/donar/confirmacion?donation_id=${donationId}`;

		try {
			const { error, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: { return_url: returnUrl },
				redirect: 'if_required'
			});

			if (error) {
				stripeError = error.message ?? 'Error al procesar el pago';
				onError(stripeError);
			} else if (paymentIntent?.status === 'succeeded') {
				onSuccess(paymentIntent.id);
			} else if (paymentIntent?.status === 'requires_action') {
				// 3DS handled automatically by Stripe; redirect occurred
			} else {
				onError(`Estado inesperado: ${paymentIntent?.status}`);
			}
		} catch (err: any) {
			stripeError = err?.message ?? 'Error desconocido';
			onError(stripeError);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="stripe-form-wrap">
	{#if loading}
		<div class="stripe-loading" aria-live="polite" aria-label="Cargando formulario de pago">
			<div class="stripe-skeleton"></div>
			<div class="stripe-skeleton short"></div>
			<div class="stripe-skeleton"></div>
		</div>
	{/if}

	<!-- Stripe mounts here -->
	<div
		bind:this={mountEl}
		id="stripe-payment-element"
		class="stripe-element-mount"
		class:hidden={loading}
	></div>

	{#if stripeError}
		<div class="stripe-error" role="alert">
			⚠ {stripeError}
		</div>
	{/if}

	<!-- Security badges -->
	{#if ready}
		<div class="stripe-secure">
			<span class="secure-badge">🔒 Pago seguro vía Stripe</span>
			<span class="secure-badge">🛡 SSL cifrado</span>
			<span class="secure-badge">💳 Visa, Mastercard, Amex</span>
		</div>
	{/if}
</div>

<style>
	.stripe-form-wrap {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.stripe-loading {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.stripe-skeleton {
		height: 52px;
		background: linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255,255,255,0.04) 50%, var(--bg-elevated) 75%);
		background-size: 200% 100%;
		border-radius: var(--radius-md);
		animation: shimmer 1.5s infinite;
		border: 1px solid var(--border-subtle);
	}
	.stripe-skeleton.short { height: 36px; width: 60%; }

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.stripe-element-mount { width: 100%; }
	.stripe-element-mount.hidden { display: none; }

	.stripe-error {
		padding: var(--space-3) var(--space-4);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		color: #f87171;
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	.stripe-secure {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		justify-content: center;
	}

	.secure-badge {
		font-size: var(--text-xs);
		color: var(--text-muted);
		padding: var(--space-1) var(--space-2);
		background: var(--bg-base);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
	}
</style>
