import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
    default: async ({ request, locals }) => {
        const auth = typeof locals.auth === 'function' ? locals.auth() : locals.auth;
        if (!auth?.userId) {
            return fail(401, { error: 'Unauthorized' });
        }
        
        const token = await auth.getToken();
        
        const data = await request.formData();
        const file = data.get('file') as File;
        const name = data.get('name') as string;
        const jurisdiction = data.get('jurisdiction') as string;
        
        if (!file || !name || !jurisdiction) {
            return fail(400, { error: 'Missing required fields' });
        }
        
        try {
            // Forward the multipart form to the FastAPI backend
            const backendFormData = new FormData();
            backendFormData.append('file', file);
            backendFormData.append('name', name);
            backendFormData.append('jurisdiction', jurisdiction);
            
            // Using absolute URL to bypass the vite proxy, or use 127.0.0.1 directly 
            // since this runs on the server side
            const response = await fetch('http://127.0.0.1:8080/api/v1/regulations/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: backendFormData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return fail(response.status, { 
                    error: errorData.detail || 'Upload failed' 
                });
            }
            
            const result = await response.json();
            return { success: true, job_id: result.job_id };
            
        } catch (error) {
            console.error('Upload error:', error);
            return fail(500, { error: 'Internal server error' });
        }
    }
} satisfies Actions;


