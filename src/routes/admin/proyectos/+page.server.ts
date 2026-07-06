import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { reviewProjectSchema } from '$lib/utils/validation';

export const load: PageServerLoad = async ({ locals, url }) => {
	const statusFilter = url.searchParams.get('estado') ?? 'pending';
	const page = Math.max(1, Number(url.searchParams.get('pagina') ?? 1));
	const limit = 20;
	const offset = (page - 1) * limit;

	let query = (locals.supabase as any)
		.from('projects')
		.select(
			'id, name, description, ong_name, ong_contact_email, ong_phone, ong_document, status, goal_amount, current_amount, website_url, rejection_reason, approved_at, created_at, area:areas(name, icon, color)',
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (statusFilter && statusFilter !== 'all') {
		query = query.eq('status', statusFilter);
	}

	const { data: projects, count } = await query;
	const totalPages = Math.ceil((count ?? 0) / limit);

	return {
		projects: (projects ?? []) as any[],
		count: count ?? 0,
		totalPages,
		page,
		statusFilter
	};
};

export const actions: Actions = {
	review: async ({ request }) => {
		const formData = await request.formData();
		const raw = {
			project_id: formData.get('project_id') as string,
			action: formData.get('action') as string,
			rejection_reason: (formData.get('rejection_reason') as string) || undefined
		};

		const result = reviewProjectSchema.safeParse(raw);
		if (!result.success) {
			return fail(400, { error: 'Datos inválidos' });
		}

		const { project_id, action, rejection_reason } = result.data;

		if (action === 'approve') {
			const { error: approveErr } = await (supabaseAdmin as any)
				.from('projects')
				.update({
					status: 'approved',
					approved_at: new Date().toISOString(),
					rejection_reason: null
				})
				.eq('id', project_id);

			if (approveErr) return fail(500, { error: 'Error al aprobar el proyecto' });
			return { success: true, message: 'Proyecto aprobado y publicado exitosamente' };
		}

		if (action === 'reject') {
			const { error: rejectErr } = await (supabaseAdmin as any)
				.from('projects')
				.update({
					status: 'rejected',
					rejection_reason: rejection_reason ?? 'No cumple con los criterios de la plataforma'
				})
				.eq('id', project_id);

			if (rejectErr) return fail(500, { error: 'Error al rechazar el proyecto' });
			return { success: true, message: 'Proyecto rechazado' };
		}

		return fail(400, { error: 'Acción no válida' });
	}
};
