import type { PageServerLoad } from './$types';
import type { Area } from '$lib/types';
import { EUR_TO_USD_RATE, USDT_TO_USD_RATE } from '$lib/utils/constants';

export const load: PageServerLoad = async ({ locals, fetch }) => {
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
	// Include country and donor_currency for multi-currency display
	const { data: recentDonations } = await locals.supabase
		.from('donations')
		.select('id, donor_name, is_anonymous, amount, currency, donor_currency, country, confirmed_at, message, area:areas(name, icon, color, slug)')
		.eq('payment_status', 'confirmed')
		.order('confirmed_at', { ascending: false })
		.limit(50);

	// Fetch recent expenses for the modal detail view (last 50)
	const { data: recentExpenses } = await locals.supabase
		.from('expenses')
		.select('id, concept, description, amount, currency, expense_date, receipt_image_url, receipt_image_urls, vendor, area:areas(name, icon, color, slug)')
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

	// Fetch official BCV rate from our endpoint
	let bcvRate = 40.0;
	try {
		const bcvRes = await fetch('/api/bcv');
		if (bcvRes.ok) {
			const bcvData = await bcvRes.json();
			if (bcvData && typeof bcvData.rate === 'number') {
				bcvRate = bcvData.rate;
			}
		}
	} catch (e) {
		console.error('Error fetching BCV rate in page load:', e);
	}

	return {
		stats: statsData ?? {
			total_raised_usd: 0,
			total_raised_ves: 0,
			total_raised_eur: 0,
			total_raised_usdt: 0,
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
		featuredProjects: (featuredProjectsRaw ?? []) as any[],
		bcvRate,
		eurToUsdRate: EUR_TO_USD_RATE,
		usdtToUsdRate: USDT_TO_USD_RATE
	};
};
