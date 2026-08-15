import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
    const auth = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
    const token = await auth?.getToken();
    
    try {
        const response = await fetch('http://127.0.0.1:8080/api/v1/regulations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const regulations = await response.json();
            return { regulations };
        }
    } catch (e) {
        console.error("Failed to fetch regulations", e);
    }
    
    return { regulations: [] };
};
