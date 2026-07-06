import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/dynamic/public';
import type { Database } from '$lib/types';

/**
 * Creates a Supabase client for use in browser/client-side code.
 * Uses the anon key — respects Row Level Security policies.
 */
export function createSupabaseClient() {
	return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}
