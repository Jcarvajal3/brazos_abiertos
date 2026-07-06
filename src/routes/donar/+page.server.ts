import type { PageServerLoad } from './$types';
import type { Area } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const preselectedAreaSlug = url.searchParams.get('area');

	const { data: areasRaw } = await locals.supabase
		.from('areas')
		.select('*')
		.eq('active', true)
		.order('sort_order');

	const areas = (areasRaw ?? []) as Area[];

	let preselectedArea: Area | null = null;
	let initialProjects: any[] = [];

	if (preselectedAreaSlug && areas.length > 0) {
		preselectedArea = areas.find((a) => a.slug === preselectedAreaSlug) ?? null;

		if (preselectedArea) {
			const { data: projects } = await locals.supabase
				.from('projects')
				.select('id, name, description, ong_name, cover_image_url, goal_amount, current_amount')
				.eq('area_id', preselectedArea.id)
				.eq('status', 'approved')
				.order('current_amount', { ascending: false });

			initialProjects = (projects ?? []) as any[];
		}
	}

	return { areas, preselectedArea, initialProjects };
};
