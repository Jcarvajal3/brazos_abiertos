import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already logged in, redirect appropriately
	const { user } = await locals.safeGetSession();
	if (user) {
		const roles: string[] = user.app_metadata?.roles ?? [];
		if (roles.includes('admin')) {
			const redirectTo = url.searchParams.get('redirect') ?? '/admin';
			throw redirect(303, redirectTo);
		}
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email?.trim() || !password) {
			return fail(400, { error: 'Correo y contraseña son requeridos', email });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, { error: 'Credenciales incorrectas. Verifica tu correo y contraseña.', email });
		}

		// Validate admin role
		const { data: { user } } = await locals.supabase.auth.getUser();
		const roles: string[] = user?.app_metadata?.roles ?? [];

		if (!roles.includes('admin')) {
			await locals.supabase.auth.signOut();
			return fail(403, { error: 'No tienes permisos de administrador.', email });
		}

		const redirectTo = url.searchParams.get('redirect') ?? '/admin';
		throw redirect(303, redirectTo);
	}
};
