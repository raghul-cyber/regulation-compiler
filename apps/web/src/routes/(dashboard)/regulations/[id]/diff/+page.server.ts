import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch, locals, url }) => {
	const auth = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
	if (!auth?.userId) {
		throw error(401, 'Unauthorized');
	}

	const regId = params.id;
    const oldV = url.searchParams.get('old_version_id');
    const newV = url.searchParams.get('new_version_id');
    
    let apiUrl = `http://127.0.0.1:8080/api/v1/regulations/${regId}/diff`;
    if (oldV && newV) {
        apiUrl += `?old_version_id=${oldV}&new_version_id=${newV}`;
    }

	try {
		const token = auth?.getToken ? await auth.getToken() : '';
		
		const res = await fetch(apiUrl, {
			headers: { Authorization: `Bearer ${token}` }
		});
		
		if (!res.ok) {
			throw error(res.status, 'Failed to fetch regulation diff');
		}
		
		const data = await res.json();
		return {
			diffData: data,
            regulationId: regId
		};
	} catch (e) {
		console.error("Fetch Error:", e);
		throw error(500, 'Internal Server Error fetching diff');
	}
};
