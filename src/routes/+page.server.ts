import type { PageServerLoad } from './$types';
import type { Area, Project } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch aggregated donation stats (view)
	const { data: statsData } = await locals.supabase
		.from('donation_stats')
		.select('*')
		.limit(1)
		.maybeSingle();

	// Fetch aggregated expense stats (view)
	const { data: expenseStatsData } = await locals.supabase
		.from('expense_stats')
		.select('*')
		.limit(1)
		.maybeSingle();

	// Fetch last 50 confirmed donations for the live feed (supports area filtering)
	const { data: recentDonations } = await locals.supabase
		.from('donations')
		.select('id, donor_name, is_anonymous, amount, currency, confirmed_at, area:areas(name, icon, slug)')
		.eq('payment_status', 'confirmed')
		.order('confirmed_at', { ascending: false })
		.limit(50);

	// Fetch recent expenses for the modal detail view (last 50)
	const { data: recentExpenses } = await locals.supabase
		.from('expenses')
		.select('id, concept, description, amount, currency, expense_date, receipt_image_url, receipt_image_urls, vendor, area:areas(name, icon, slug)')
		.order('expense_date', { ascending: false })
		.limit(50);

	// Fetch active areas with their config
	const { data: areasRaw } = await locals.supabase
		.from('areas')
		.select('*')
		.eq('active', true)
		.order('sort_order');

	// Fetch featured approved projects (latest 3)
	const { data: featuredProjectsRaw } = await locals.supabase
		.from('projects')
		.select('id, name, description, ong_name, cover_image_url, goal_amount, current_amount, area:areas(name, icon, color, slug)')
		.eq('status', 'approved')
		.order('approved_at', { ascending: false })
		.limit(3);

	return {
		stats: statsData ?? {
			total_raised_usd: 0,
			total_raised_ves: 0,
			total_donors: 0,
			total_donations: 0,
			last_updated: new Date().toISOString()
		},
		expenseStats: expenseStatsData ?? {
			total_expenses_usd: 0,
			total_expenses_ves: 0,
			total_expense_records: 0,
			last_updated: new Date().toISOString()
		},
		recentDonations: (recentDonations ?? []) as any[],
		recentExpenses: (recentExpenses ?? []) as any[],
		areas: (areasRaw ?? []) as Area[],
		featuredProjects: (featuredProjectsRaw ?? []) as any[]
	};
};
