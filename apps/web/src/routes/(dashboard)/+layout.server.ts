import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// locals.auth is a function in svelte-clerk, not a direct object.
	const auth = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
	
	// If the user is not authenticated, redirect to sign-in
	if (!auth?.userId) {
		throw redirect(307, '/sign-in');
	}

	return {
		userId: auth.userId
	};
};
