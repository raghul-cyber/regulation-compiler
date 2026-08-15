import { json } from '@sveltejs/kit';

export async function GET({ params, locals, fetch }) {
    const auth = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
    if (!auth?.userId) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    const token = await auth.getToken();
    
    try {
        const response = await fetch(`http://127.0.0.1:8080/api/v1/jobs/` + params.id, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await response.json();
        return json(data, { status: response.status });
    } catch (e) {
        return json({ error: 'Failed to fetch job' }, { status: 500 });
    }
}
