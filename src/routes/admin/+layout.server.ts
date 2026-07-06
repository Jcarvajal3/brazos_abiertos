import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/login?redirect=/admin');
	}

	const roles: string[] = user.app_metadata?.roles ?? [];
	if (!roles.includes('admin')) {
		throw redirect(303, '/');
	}

	// Fetch all admin data in parallel
	const [profileRes, pendingDonRes, pendingProjRes] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('full_name, email')
			.eq('id', user.id)
			.maybeSingle(),

		// Pending manual donations (for sidebar badge)
		locals.supabase
			.from('donations')
			.select('id', { count: 'exact', head: true })
			.eq('payment_status', 'pending')
			.in('payment_method', ['pago_movil', 'transferencia']),

		// Pending project approvals (for sidebar badge)
		locals.supabase
			.from('projects')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'pending')
	]);

	return {
		adminUser: {
			id: user.id,
			email: user.email ?? '',
			name: (profileRes.data as any)?.full_name ?? user.email ?? 'Administrador'
		},
		pendingDonations: pendingDonRes.count ?? 0,
		pendingProjects: pendingProjRes.count ?? 0
	};
};
