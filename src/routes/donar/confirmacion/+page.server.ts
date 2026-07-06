import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Support both ?id= (manual) and ?donation_id= (Stripe redirect)
	const donationId = url.searchParams.get('id') ?? url.searchParams.get('donation_id');

	if (!donationId) {
		throw error(404, 'No se encontró la donación');
	}

	const { data, error: dbError } = await locals.supabase
		.from('donations')
		.select(
			'id, donor_name, donor_email, is_anonymous, amount, currency, payment_method, payment_status, message, created_at, area:areas(name, icon, color, slug), project:projects(name, ong_name)'
		)
		.eq('id', donationId)
		.maybeSingle();

	if (dbError || !data) {
		throw error(404, 'Donación no encontrada');
	}

	const donation = data as any;

	// If Stripe just redirected, the webhook may not have fired yet.
	// We check the payment_intent status if the pi param is present.
	const piParam = url.searchParams.get('pi') ?? url.searchParams.get('payment_intent');

	return {
		donation,
		// Pass through so client can show "processing" state for Stripe
		stripeReturnStatus: url.searchParams.get('redirect_status') ?? null,
		paymentIntentId: piParam ?? null
	};
};
