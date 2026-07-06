import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'sk_test_placeholder') {
		throw error(503, 'Stripe no está configurado');
	}
	if (!STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET === 'whsec_placeholder') {
		throw error(503, 'Stripe webhook secret no está configurado');
	}

	const Stripe = (await import('stripe')).default;
	const stripe = new Stripe(STRIPE_SECRET_KEY);

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		throw error(400, 'Firma de webhook faltante');
	}

	const body = await request.text();

	let event: import('stripe').Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err: any) {
		console.error('Webhook signature verification failed:', err.message);
		throw error(400, `Webhook Error: ${err.message}`);
	}

	switch (event.type) {
		case 'payment_intent.succeeded': {
			const paymentIntent = event.data.object as import('stripe').Stripe.PaymentIntent;

			const { data: donationRow } = await supabaseAdmin
				.from('donations')
				.select('id, project_id, amount')
				.eq('stripe_payment_intent_id', paymentIntent.id)
				.maybeSingle();

			if (!donationRow) {
				console.warn('Webhook: donation not found for PI', paymentIntent.id);
				break;
			}

			const d = donationRow as any;

			// Update donation status to confirmed
			await (supabaseAdmin as any)
				.from('donations')
				.update({
					payment_status: 'confirmed',
					confirmed_at: new Date().toISOString()
				})
				.eq('id', d.id);

			// Increment project amount if linked
			if (d.project_id) {
				await (supabaseAdmin as any).rpc('increment_project_amount', {
					p_project_id: d.project_id,
					p_amount: Number(d.amount)
				});
			}

			console.log(`✅ Stripe: Donation ${d.id} confirmed via webhook`);
			break;
		}

		case 'payment_intent.payment_failed': {
			const paymentIntent = event.data.object as import('stripe').Stripe.PaymentIntent;

			await (supabaseAdmin as any)
				.from('donations')
				.update({
					payment_status: 'failed',
					admin_notes: `Stripe: ${paymentIntent.last_payment_error?.message ?? 'Payment failed'}`
				})
				.eq('stripe_payment_intent_id', paymentIntent.id);

			console.log(`❌ Stripe: Payment failed for PI ${paymentIntent.id}`);
			break;
		}

		default:
			// Ignore unhandled event types
			console.log(`Stripe webhook: unhandled event type ${event.type}`);
	}

	return json({ received: true });
};
