import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
    const auth = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
    const token = await auth?.getToken();
    
    const regulationId = params.id;
    
    try {
        const response = await fetch(`http://127.0.0.1:8080/api/v1/regulations/${regulationId}/requirements`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return { 
                requirements: result.data || [],
                regulationId
            };
        }
    } catch (e) {
        console.error("Failed to fetch requirements", e);
    }
    
    return { requirements: [], regulationId };
};
