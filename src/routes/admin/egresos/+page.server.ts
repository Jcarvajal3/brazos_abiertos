import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch all expenses with their area details
	const { data: expenses, error: expensesError } = await locals.supabase
		.from('expenses')
		.select('id, concept, description, amount, currency, expense_date, receipt_image_url, receipt_image_urls, vendor, notes, created_at, area:areas(id, name, icon, color, slug)')
		.order('expense_date', { ascending: false })
		.order('created_at', { ascending: false });

	if (expensesError) {
		console.error('Error fetching expenses:', expensesError);
	}

	// Fetch active areas for the select dropdown
	const { data: areas, error: areasError } = await locals.supabase
		.from('areas')
		.select('id, name, icon, color, slug')
		.eq('active', true)
		.order('sort_order');

	if (areasError) {
		console.error('Error fetching areas:', areasError);
	}

	return {
		expenses: (expenses ?? []) as any[],
		areas: (areas ?? []) as any[]
	};
};

export const actions: Actions = {
	addExpense: async ({ request, locals }) => {
		const session = await locals.safeGetSession();
		if (!session.user) {
			return fail(401, { error: 'No autorizado' });
		}

		const formData = await request.formData();
		const concept = formData.get('concept') as string;
		const description = formData.get('description') as string;
		const amountStr = formData.get('amount') as string;
		const currency = formData.get('currency') as string;
		const area_id = formData.get('area_id') as string;
		const expense_date = formData.get('expense_date') as string;
		const vendor = formData.get('vendor') as string;
		const notes = formData.get('notes') as string;
		const receiptImageUrlsRaw = formData.get('receipt_image_urls') as string;

		// Validation
		if (!concept || concept.trim() === '') {
			return fail(400, { error: 'El concepto es requerido' });
		}
		if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
			return fail(400, { error: 'El monto debe ser un número mayor a 0' });
		}
		if (!currency || !['USD', 'VES'].includes(currency)) {
			return fail(400, { error: 'La moneda seleccionada no es válida' });
		}
		if (!area_id) {
			return fail(400, { error: 'El área es requerida' });
		}
		if (!expense_date) {
			return fail(400, { error: 'La fecha es requerida' });
		}

		let receipt_image_urls: string[] = [];
		try {
			if (receiptImageUrlsRaw) {
				receipt_image_urls = JSON.parse(receiptImageUrlsRaw);
			}
		} catch (e) {
			console.error('Error parsing receipt_image_urls:', e);
		}

		const receipt_image_url = receipt_image_urls.length > 0 ? receipt_image_urls[0] : null;

		const { error: insertError } = await locals.supabase
			.from('expenses')
			.insert({
				concept: concept.trim(),
				description: description ? description.trim() : null,
				amount: Number(amountStr),
				currency,
				area_id,
				expense_date,
				vendor: vendor ? vendor.trim() : null,
				notes: notes ? notes.trim() : null,
				receipt_image_url,
				receipt_image_urls: receipt_image_urls.length > 0 ? receipt_image_urls : null,
				created_by: session.user.id
			} as any);

		if (insertError) {
			console.error('Error inserting expense:', insertError);
			return fail(500, { error: `Error al registrar el egreso: ${insertError.message}` });
		}

		return { success: true, message: 'Egreso registrado exitosamente' };
	}
};
