import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { confirmPaymentSchema } from '$lib/utils/validation';

export const load: PageServerLoad = async ({ locals, url }) => {
	const statusFilter = url.searchParams.get('estado') ?? 'pending';
	const methodFilter = url.searchParams.get('metodo') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('pagina') ?? 1));
	const limit = 25;
	const offset = (page - 1) * limit;

	let query = (locals.supabase as any)
		.from('donations')
		.select(
			'id, donor_name, donor_email, is_anonymous, amount, currency, payment_method, payment_status, manual_reference, manual_bank, message, created_at, confirmed_at, admin_notes, area:areas(name, icon, slug), project:projects(name, ong_name)',
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (statusFilter && statusFilter !== 'all') {
		query = query.eq('payment_status', statusFilter);
	}
	if (methodFilter) {
		query = query.eq('payment_method', methodFilter);
	}

	const { data: donations, count } = await query;

	const totalPages = Math.ceil((count ?? 0) / limit);

	return {
		donations: (donations ?? []) as any[],
		count: count ?? 0,
		totalPages,
		page,
		statusFilter,
		methodFilter
	};
};

export const actions: Actions = {
	confirm: async ({ request }) => {
		const formData = await request.formData();
		const raw = {
			donation_id: formData.get('donation_id') as string,
			action: formData.get('action') as string,
			admin_notes: (formData.get('admin_notes') as string) || undefined
		};

		const result = confirmPaymentSchema.safeParse(raw);
		if (!result.success) {
			return fail(400, { error: 'Datos inválidos' });
		}

		const { donation_id, action, admin_notes } = result.data;

		if (action === 'confirm') {
			// 1. Mark donation as confirmed
			const { data: donationRow, error: fetchErr } = await supabaseAdmin
				.from('donations')
				.select('id, project_id, amount')
				.eq('id', donation_id)
				.single();

			if (fetchErr || !donationRow) {
				return fail(404, { error: 'Donación no encontrada' });
			}

			const d = (donationRow as any);

			const { error: confirmErr } = await (supabaseAdmin as any)
				.from('donations')
				.update({
					payment_status: 'confirmed',
					confirmed_at: new Date().toISOString(),
					admin_notes: admin_notes ?? null
				})
				.eq('id', donation_id);

			if (confirmErr) {
				console.error('Confirm error:', confirmErr);
				return fail(500, { error: 'Error al confirmar la donación' });
			}

			// 2. Increment project.current_amount if linked to a project
			if (d.project_id) {
				await (supabaseAdmin as any).rpc('increment_project_amount', {
					p_project_id: d.project_id,
					p_amount: Number(d.amount)
				});
			}

			return { success: true, message: 'Donación confirmada exitosamente' };
		}

		if (action === 'reject') {
			const { error: rejectErr } = await (supabaseAdmin as any)
				.from('donations')
				.update({
					payment_status: 'failed',
					admin_notes: admin_notes ?? null
				})
				.eq('id', donation_id);

			if (rejectErr) {
				return fail(500, { error: 'Error al rechazar la donación' });
			}

			return { success: true, message: 'Donación rechazada' };
		}

		return fail(400, { error: 'Acción no válida' });
	}
};
