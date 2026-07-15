import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
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

  const { pathname } = req.nextUrl;
  
  // Basic WAF/Rate limiting logic could go here
  
  // Protect /dashboard and /events routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/events') || pathname === '/') {
    // If accessing root, redirect to events
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/events', req.url));
    }
    
    // Lazily evaluate session to prevent blocking non-protected routes
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If not authenticated, redirect to login
      if (!user) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch {
      // Auth service unavailable (e.g. misconfigured env vars or network issue)
      // Redirect to login rather than crashing the entire request
      console.error('Auth check failed in middleware — redirecting to /login');
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Prevent logged in users from seeing the login page
  if (pathname === '/login') {
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};