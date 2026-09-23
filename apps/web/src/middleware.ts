import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sitemap.xml',
  '/sitemap(.*)',
  '/robots.txt',
  '/regulations(.*)',
  '/compliance-check(.*)',
  '/billing(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/r3f-test(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/api/jobs(.*)',
  '/api/audit(.*)',
  '/.well-known(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt' || pathname.startsWith('/.well-known')) {
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
};
