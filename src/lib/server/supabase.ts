import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/dynamic/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/dynamic/private';
import type { Database } from '$lib/types';
import type { Cookies } from '@sveltejs/kit';

/**
 * Creates a Supabase client for server-side use in SvelteKit.
 * Reads/writes the session from cookies for SSR-compatible auth.
 * Uses the anon key — respects Row Level Security.
 */
export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) =>
					cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});
}

/**
 * Supabase Admin client with service_role key.
 * IMPORTANT: Only use server-side. Bypasses RLS — handle with care.
 * Used for: setting user roles, confirming manual payments, admin operations.
 */
export const supabaseAdmin = createClient<Database>(
	PUBLIC_SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);
