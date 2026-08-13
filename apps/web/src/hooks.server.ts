import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { withClerkHandler } from 'svelte-clerk/server';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

// Ensure Clerk backend can read the secret key in SvelteKit
if (privateEnv.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY) {
    process.env.CLERK_SECRET_KEY = privateEnv.CLERK_SECRET_KEY;
}
if (env.PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.PUBLIC_CLERK_PUBLISHABLE_KEY) {
    process.env.PUBLIC_CLERK_PUBLISHABLE_KEY = env.PUBLIC_CLERK_PUBLISHABLE_KEY;
}

if (env.PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: env.PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
}

export const handleError = Sentry.handleErrorWithSentry();

export const handle: Handle = sequence(Sentry.sentryHandle(), withClerkHandler());
