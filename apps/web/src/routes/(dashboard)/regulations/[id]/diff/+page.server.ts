import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, fetch, locals, url }) => {
	if (!locals.auth?.userId) {
		throw error(401, 'Unauthorized');
	}

	const regId = params.id;
    // Optional query params for specific versions
    const oldV = url.searchParams.get('old_version_id');
    const newV = url.searchParams.get('new_version_id');
    
    let apiUrl = `${env.API_BASE_URL}/v1/regulations/${regId}/diff`;
    if (oldV && newV) {
        apiUrl += `?old_version_id=${oldV}&new_version_id=${newV}`;
    }

	try {
		const token = locals.auth.getToken ? await locals.auth.getToken() : '';
		
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
