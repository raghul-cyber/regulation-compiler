import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, url, fetch, locals }) => {
	const regulationId = params.id;
	
	if (!locals.auth?.userId) {
		throw error(401, 'Unauthorized');
	}

	const reqId = url.searchParams.get('req_id');

	try {
		const token = locals.auth.getToken ? await locals.auth.getToken() : '';
		
		const res = await fetch(`${env.API_BASE_URL}/v1/regulations/${regulationId}/requirements?limit=50`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		
		if (!res.ok) {
			throw error(res.status, 'Failed to fetch requirements');
		}
		
		const data = await res.json();
		return {
			regulationId,
			requirements: data.data,
			nextCursor: data.next_cursor,
			selectedReqId: reqId
		};
	} catch (e) {
		console.error("Fetch Error:", e);
		throw error(500, 'Internal Server Error');
	}
};
