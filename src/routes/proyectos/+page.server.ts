import type { PageServerLoad } from './$types';
import type { Area } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const areaFilter = url.searchParams.get('area');

	const { data: areasRaw } = await locals.supabase
		.from('areas')
		.select('id, name, slug, icon, color')
		.eq('active', true)
		.order('sort_order');

	const areas = (areasRaw ?? []) as Pick<Area, 'id' | 'name' | 'slug' | 'icon' | 'color'>[];

	// Build base projects query
	const baseQuery = locals.supabase
		.from('projects')
		.select(
			'id, name, description, ong_name, cover_image_url, goal_amount, current_amount, created_at, area:areas(id, name, slug, icon, color)'
		)
		.eq('status', 'approved')
		.order('current_amount', { ascending: false });

	let projects: any[] = [];

	if (areaFilter && areas.length > 0) {
		const matchingArea = areas.find((a) => a.slug === areaFilter);
		if (matchingArea) {
			const { data } = await baseQuery.eq('area_id', matchingArea.id);
			projects = (data ?? []) as any[];
		} else {
			const { data } = await baseQuery;
			projects = (data ?? []) as any[];
		}
	} else {
		const { data } = await baseQuery;
		projects = (data ?? []) as any[];
	}

	return {
		areas,
		projects,
		activeAreaSlug: areaFilter ?? null
	};
};
