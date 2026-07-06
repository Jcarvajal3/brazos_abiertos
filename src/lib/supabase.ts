import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from '$lib/types';

/**
 * Creates a Supabase client for use in browser/client-side code.
 * Uses the anon key — respects Row Level Security policies.
 */
export function createSupabaseClient() {
	return createBrowserClient<Database>(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}
