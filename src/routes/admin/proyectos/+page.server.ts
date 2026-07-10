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

	const [projectsRes, areasRes] = await Promise.all([
		query,
		locals.supabase
			.from('areas')
			.select('id, name, icon, color, slug')
			.eq('active', true)
			.order('sort_order')
	]);

	const { data: projects, count } = projectsRes;
	const totalPages = Math.ceil((count ?? 0) / limit);

	return {
		projects: (projects ?? []) as any[],
		count: count ?? 0,
		totalPages,
		page,
		statusFilter,
		areas: (areasRes.data ?? []) as any[]
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
	},

	addProject: async ({ request, locals }) => {
		const session = await locals.safeGetSession();
		if (!session.user) {
			return fail(401, { error: 'No autorizado' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const ong_name = formData.get('ong_name') as string;
		const ong_contact_email = formData.get('ong_contact_email') as string;
		const ong_phone = formData.get('ong_phone') as string;
		const ong_document = formData.get('ong_document') as string;
		const area_id = formData.get('area_id') as string;
		const goal_amount_str = formData.get('goal_amount') as string;
		const website_url = formData.get('website_url') as string;
		const cover_image_url = formData.get('cover_image_url') as string;

		// Validation
		if (!name || name.trim() === '') return fail(400, { error: 'El nombre del proyecto es requerido' });
		if (!description || description.trim() === '') return fail(400, { error: 'La descripción es requerida' });
		if (!ong_name || ong_name.trim() === '') return fail(400, { error: 'El nombre de la organización (ONG) es requerido' });
		if (!ong_contact_email || ong_contact_email.trim() === '') return fail(400, { error: 'El correo de contacto es requerido' });
		if (!area_id) return fail(400, { error: 'El área es requerida' });

		const goal_amount = goal_amount_str ? Number(goal_amount_str) : null;
		if (goal_amount !== null && (isNaN(goal_amount) || goal_amount <= 0)) {
			return fail(400, { error: 'La meta de recaudación debe ser un número mayor a 0' });
		}

		const { error: insertError } = await (supabaseAdmin as any)
			.from('projects')
			.insert({
				name: name.trim(),
				description: description.trim(),
				ong_name: ong_name.trim(),
				ong_contact_email: ong_contact_email.trim(),
				ong_phone: ong_phone ? ong_phone.trim() : null,
				ong_document: ong_document ? ong_document.trim() : null,
				area_id,
				goal_amount,
				current_amount: 0,
				website_url: website_url ? website_url.trim() : null,
				cover_image_url: cover_image_url ? cover_image_url.trim() : null,
				status: 'approved',
				approved_at: new Date().toISOString()
			} as any);

		if (insertError) {
			console.error('Error inserting project:', insertError);
			return fail(500, { error: `Error al crear el proyecto: ${insertError.message}` });
		}

		return { success: true, message: 'Proyecto creado y publicado exitosamente' };
	}
};
