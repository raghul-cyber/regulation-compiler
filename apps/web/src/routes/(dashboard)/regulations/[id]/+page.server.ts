import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	const regulationId = params.id;

	if (!locals.auth?.userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const token = locals.auth.getToken ? await locals.auth.getToken() : '';
		const headers = { Authorization: `Bearer ${token}` };

		// Fetch summary metrics
		const summaryRes = await fetch(`${env.API_BASE_URL}/v1/regulations/${regulationId}/dashboard-summary`, { headers });
		if (!summaryRes.ok) throw error(summaryRes.status, 'Failed to fetch summary');
		const summary = await summaryRes.json();

		// Fetch recent activity
		const activityRes = await fetch(`${env.API_BASE_URL}/v1/regulations/${regulationId}/activity`, { headers });
		if (!activityRes.ok) throw error(activityRes.status, 'Failed to fetch activity');
		const activity = await activityRes.json();

		return {
			regulationId,
			summary,
			activity: activity.data
		};
	} catch (e) {
		console.error("Dashboard Fetch Error:", e);
		throw error(500, 'Internal Server Error fetching dashboard data');
	}
};
