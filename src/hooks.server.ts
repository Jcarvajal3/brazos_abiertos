import { createSupabaseServerClient } from '$lib/server/supabase';
import { redirect, type Handle } from '@sveltejs/kit';
import { ADMIN_ROUTES_PREFIX } from '$lib/utils/constants';
import { sequence } from '@sveltejs/kit/hooks';

/**
 * Hook 1: Initialize Supabase client and attach to locals.
 * Makes `locals.supabase` and `locals.safeGetSession` available to all server routes.
 */
const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event.cookies);

	/**
	 * safeGetSession validates the token via Supabase's server-side `getUser()`.
	 * IMPORTANT: Use `getUser()` instead of `getSession()` for security-critical checks.
	 * `getSession()` is not guaranteed to revalidate the token with the server.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		// Revalidate token server-side
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	// Attach session and user to locals for convenience
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Required by @supabase/ssr to pass auth cookies through
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

/**
 * Hook 2: Protect admin routes.
 * Redirects unauthenticated users to /login.
 * Redirects authenticated non-admins to homepage.
 */
const adminAuthHandle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith(ADMIN_ROUTES_PREFIX)) {
		return resolve(event);
	}

	// Allow login page through
	if (event.url.pathname === '/admin/login') {
		return resolve(event);
	}

	const user = event.locals.user;

	if (!user) {
		throw redirect(303, `/login?redirect=${encodeURIComponent(event.url.pathname)}`);
	}

	// Check admin role from app_metadata (set server-side, not user-modifiable)
	const roles: string[] = user.app_metadata?.roles ?? [];
	if (!roles.includes('admin')) {
		// Authenticated but not admin → redirect to home
		throw redirect(303, '/');
	}

	return resolve(event);
};

/**
 * Hook 3: Security headers.
 */
const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Content Security Policy and other security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=()'
	);

	return response;
};

export const handle = sequence(supabaseHandle, adminAuthHandle, securityHandle);
