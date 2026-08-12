import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	if (!locals.auth?.userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const token = locals.auth.getToken ? await locals.auth.getToken() : '';
		
		const res = await fetch(`${env.API_BASE_URL}/v1/impacts`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		
		if (!res.ok) {
			throw error(res.status, 'Failed to fetch impact records');
		}
		
		const data = await res.json();
		return {
			impacts: data.data || []
		};
	} catch (e) {
		console.error("Fetch Error:", e);
		throw error(500, 'Internal Server Error fetching impacts');
	}
};
