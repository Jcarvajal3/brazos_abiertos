import type { LayoutServerLoad } from './$types';

/**
 * Root layout server load.
 * Makes session and user available to all pages via PageData.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	return {
		session,
		user
	};
};
