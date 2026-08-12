import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params, locals, fetch }) => {
    const auth = locals.auth as any;
    if (!auth?.userId) {
        throw error(401, 'Unauthorized');
    }
    
    const token = await auth.getToken();
    
    try {
        const response = await fetch(`${env.API_BASE_URL || 'http://127.0.0.1:8000/api'}/v1/jobs/${params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw error(response.status, 'Failed to fetch job status');
        }
        
        const data = await response.json();
        return json(data);
    } catch (e) {
        console.error('Job polling error:', e);
        throw error(500, 'Internal Server Error');
    }
};
