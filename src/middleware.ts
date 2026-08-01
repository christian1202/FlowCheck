import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Immediately bypass public pre-registration routes without initializing Supabase client
  // Matches: /events/{slug}/register or /events/{id}/register
  const isPublicRegistration = /^\/events\/[^/]+\/register\/?$/i.test(pathname);
  if (isPublicRegistration) {
    return NextResponse.next();
  }

  // 2. Redirect single event slug/id path without /register suffix directly to the register portal for attendees
  // E.g., /events/{slug} -> /events/{slug}/register (excluding admin reserved keywords /events/all and /events/new)
  const eventSlugMatch = /^\/events\/([^/]+)\/?$/i.exec(pathname);
  if (eventSlugMatch) {
    const slugCandidate = eventSlugMatch[1].toLowerCase();
    const reservedAdminRoutes = ['all', 'new'];
    if (!reservedAdminRoutes.includes(slugCandidate)) {
      return NextResponse.redirect(new URL(`/events/${eventSlugMatch[1]}/register`, req.url));
    }
  }

  // 3. Handle root route redirect to events dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/events', req.url));
  }

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/events');
  const isLoginRoute = pathname === '/login';

  // 4. Immediately bypass non-protected and non-login routes
  if (!isProtected && !isLoginRoute) {
    return NextResponse.next();
  }

  // 5. Initialize Supabase client ONLY for routes that require authentication
  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 6. Protect /dashboard and administrative /events routes
  if (isProtected) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch {
      console.error('Auth check failed in middleware — redirecting to /login');
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 7. Prevent logged-in users from seeing the login page
  if (isLoginRoute) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.redirect(new URL('/events', req.url));
      }
    } catch {
      // Ignore
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};