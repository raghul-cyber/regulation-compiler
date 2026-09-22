import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/r3f-test(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/api/jobs(.*)',
  '/api/audit(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/.well-known(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt)).*)',
    '/(api|trpc)(.*)',
  ],
};
