import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, fetch, locals }) => {
	const regulationId = params.id;
	
	const auth = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
	if (!auth?.userId) {
		throw error(401, 'Unauthorized');
	}

	const reqId = url.searchParams.get('req_id');

	try {
		const token = auth?.getToken ? await auth.getToken() : '';
		
		const res = await fetch(`http://127.0.0.1:8080/api/v1/regulations/${regulationId}/requirements?limit=50`, {
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
