import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { withClerkHandler } from 'svelte-clerk/server';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

if (env.PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: env.PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
}

export const handleError = Sentry.handleErrorWithSentry();

export const handle: Handle = sequence(Sentry.sentryHandle(), withClerkHandler());
