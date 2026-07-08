import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { donationSchema } from '$lib/utils/validation';
import { supabaseAdmin } from '$lib/server/supabase';
import { env } from '$env/dynamic/private';
import { checkRateLimit, getClientIp } from '$lib/server/rateLimit';

let stripeInstance: import('stripe').default | null = null;

async function getStripe() {
	if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
		return null;
	}
	if (!stripeInstance) {
		const Stripe = (await import('stripe')).default;
		stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
	}
	return stripeInstance;
}

export const POST: RequestHandler = async ({ request }) => {
	// ── Rate limit: max 5 donation attempts per IP per minute ──
	const ip = getClientIp(request);
	const { allowed, remaining, resetMs } = checkRateLimit(ip, { limit: 5, windowMs: 60_000 });
	if (!allowed) {
		const retryAfter = Math.ceil((resetMs - Date.now()) / 1000);
		return json(
			{ success: false, error: 'Demasiadas solicitudes. Por favor espera un momento.' },
			{ status: 429, headers: { 'Retry-After': String(retryAfter) } }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Cuerpo de la solicitud inválido');
	}

	// Validate with Zod
	const result = donationSchema.safeParse(body);
	if (!result.success) {
		return json(
			{ success: false, error: 'Datos inválidos', issues: result.error.flatten() },
			{ status: 400 }
		);
	}

	const data = result.data;

	// ─── Stripe Payment ───────────────────────────────────────────
	if (data.payment_method === 'stripe') {
		const stripe = await getStripe();

		if (!stripe) {
			return json(
				{ success: false, error: 'Stripe no está configurado. Por favor usa Pago Móvil o Transferencia Bancaria.' },
				{ status: 503 }
			);
		}

		const amountInCents = Math.round(data.amount * 100);

		try {
			const paymentIntent = await stripe.paymentIntents.create({
				amount: amountInCents,
				currency: 'usd',
				metadata: {
					area_id: data.area_id,
					project_id: data.project_id ?? '',
					donor_email: data.donor_email ?? '',
					donor_name: data.is_anonymous ? 'anonymous' : (data.donor_name ?? 'anonymous')
				},
				automatic_payment_methods: { enabled: true }
			});

			// Insert donation record with 'pending' status
			const { data: insertedStripe, error: dbError } = await supabaseAdmin
				.from('donations')
				.insert({
					area_id: data.area_id,
					project_id: data.project_id ?? null,
					donor_name: data.is_anonymous ? null : (data.donor_name ?? null),
					donor_email: data.donor_email ?? null,
					amount: data.amount,
					currency: 'USD',
					payment_method: 'stripe',
					payment_status: 'pending',
					stripe_payment_intent_id: paymentIntent.id,
					is_anonymous: data.is_anonymous,
					message: data.message ?? null
				} as any)
				.select('id')
				.single();

			if (dbError || !insertedStripe) {
				console.error('DB insert error (stripe):', dbError);
				await stripe.paymentIntents.cancel(paymentIntent.id);
				throw error(500, 'Error al registrar la donación');
			}

			const stripeRecord = insertedStripe as any;

			if (!stripeRecord.id) {
				console.error('DB insert returned no ID (stripe)');
				await stripe.paymentIntents.cancel(paymentIntent.id);
				throw error(500, 'Error al registrar la donación: no se obtuvo ID');
			}

			return json({
				success: true,
				method: 'stripe',
				clientSecret: paymentIntent.client_secret,
				donationId: stripeRecord.id
			});
		} catch (stripeError: any) {
			// If it's already an HttpError from above, rethrow
			if (stripeError?.status) throw stripeError;
			console.error('Stripe error:', stripeError);
			return json(
				{ success: false, error: 'Error al procesar el pago con tarjeta.' },
				{ status: 502 }
			);
		}
	}

	// ─── Manual Payment (Pago Móvil / Transferencia) ──────────────
	const { data: insertedManual, error: dbError } = await supabaseAdmin
		.from('donations')
		.insert({
			area_id: data.area_id,
			project_id: data.project_id ?? null,
			donor_name: data.is_anonymous ? null : (data.donor_name ?? null),
			donor_email: data.donor_email ?? null,
			amount: data.amount,
			currency: data.currency,
			payment_method: data.payment_method,
			payment_status: 'pending',
			manual_reference: data.manual_reference ?? null,
			manual_bank: data.manual_bank ?? null,
			is_anonymous: data.is_anonymous,
			message: data.message ?? null
		} as any)
		.select('id')
		.single();

	if (dbError || !insertedManual) {
		console.error('DB insert error (manual):', dbError);
		throw error(500, 'Error al registrar la donación');
	}

	const manualRecord = insertedManual as any;

	if (!manualRecord.id) {
		console.error('DB insert returned no ID (manual)');
		throw error(500, 'Error al registrar la donación: no se obtuvo ID');
	}

	return json({
		success: true,
		method: data.payment_method,
		donationId: manualRecord.id
	});
};
