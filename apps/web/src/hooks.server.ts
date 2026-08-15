import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { withClerkHandler } from 'svelte-clerk/server';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

if (env.PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: env.PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
}

export const handleError = Sentry.handleErrorWithSentry();

export const handle: Handle = sequence(
    Sentry.sentryHandle(),
    withClerkHandler({
        secretKey: privateEnv.CLERK_SECRET_KEY,
        publishableKey: env.PUBLIC_CLERK_PUBLISHABLE_KEY
    })
);
