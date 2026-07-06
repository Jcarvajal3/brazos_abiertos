import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { projectRegistrationSchema } from '$lib/utils/validation';
import { supabaseAdmin } from '$lib/server/supabase';
import type { Area } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: areasRaw } = await locals.supabase
		.from('areas')
		.select('id, name, slug, icon')
		.eq('active', true)
		.order('sort_order');

	return { areas: (areasRaw ?? []) as Pick<Area, 'id' | 'name' | 'slug' | 'icon'>[] };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const raw = {
			area_id: formData.get('area_id') as string,
			name: formData.get('name') as string,
			description: formData.get('description') as string,
			ong_name: formData.get('ong_name') as string,
			ong_contact_email: formData.get('ong_contact_email') as string,
			ong_phone: (formData.get('ong_phone') as string) || undefined,
			ong_document: (formData.get('ong_document') as string) || undefined,
			goal_amount: formData.get('goal_amount')
				? Number(formData.get('goal_amount'))
				: undefined,
			website_url: (formData.get('website_url') as string) || undefined
		};

		const result = projectRegistrationSchema.safeParse(raw);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors as Record<string, string[]>,
				values: raw
			});
		}

		const { error } = await supabaseAdmin
			.from('projects')
			.insert({
				area_id: result.data.area_id,
				name: result.data.name,
				description: result.data.description,
				ong_name: result.data.ong_name,
				ong_contact_email: result.data.ong_contact_email,
				ong_phone: result.data.ong_phone ?? null,
				ong_document: result.data.ong_document ?? null,
				goal_amount: result.data.goal_amount ?? null,
				website_url: result.data.website_url ?? null,
				status: 'pending'
			} as any);

		if (error) {
			console.error('Project insert error:', error);
			return fail(500, {
				errors: {
					_global: ['Ocurrió un error al registrar el proyecto. Inténtalo de nuevo.']
				} as Record<string, string[]>,
				values: raw
			});
		}

		redirect(303, '/proyectos/registrar?exito=1');
	}
};
