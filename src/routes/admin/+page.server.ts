import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Aggregate stats for dashboard
	const [statsRes, pendingDonationsRes, pendingProjectsRes, recentActivityRes] = await Promise.all([
		// Total stats
		locals.supabase.from('donation_stats').select('*').limit(1).maybeSingle(),

		// Pending manual donations count
		locals.supabase
			.from('donations')
			.select('id', { count: 'exact', head: true })
			.eq('payment_status', 'pending')
			.in('payment_method', ['pago_movil', 'transferencia']),

		// Pending project approvals count
		locals.supabase
			.from('projects')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'pending'),

		// Recent donations (last 10)
		locals.supabase
			.from('donations')
			.select('id, donor_name, is_anonymous, amount, currency, payment_method, payment_status, created_at, area:areas(name, icon)')
			.order('created_at', { ascending: false })
			.limit(10)
	]);

	// Donations by status breakdown
	const { data: byStatus } = await locals.supabase
		.from('donations')
		.select('payment_status, amount, currency');

	const breakdown = {
		confirmed_usd: 0,
		confirmed_ves: 0,
		pending_count: 0,
		failed_count: 0,
		total_count: byStatus?.length ?? 0
	};

	for (const d of byStatus ?? []) {
		const row = d as any;
		if (row.payment_status === 'confirmed') {
			if (row.currency === 'USD') breakdown.confirmed_usd += Number(row.amount);
			else breakdown.confirmed_ves += Number(row.amount);
		} else if (row.payment_status === 'pending') breakdown.pending_count++;
		else if (row.payment_status === 'failed') breakdown.failed_count++;
	}

	return {
		stats: (statsRes.data as any) ?? { total_raised_usd: 0, total_raised_ves: 0, total_donors: 0, total_donations: 0 },
		pendingDonations: pendingDonationsRes.count ?? 0,
		pendingProjects: pendingProjectsRes.count ?? 0,
		recentActivity: (recentActivityRes.data ?? []) as any[],
		breakdown
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		throw redirect(303, '/login');
	}
};
