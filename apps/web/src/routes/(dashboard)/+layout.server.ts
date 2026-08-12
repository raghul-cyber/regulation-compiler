import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const auth = locals.auth as any;
	// If the user is not authenticated, redirect to sign-in
	if (!auth.userId) {
		throw redirect(307, '/sign-in');
	}

	return {
		userId: auth.userId
	};
};
