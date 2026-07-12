import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(req: NextRequest) {
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
  
  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Basic WAF/Rate limiting logic could go here
  
  // Protect /dashboard and /events routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/events') || pathname === '/') {
    // If accessing root, redirect to events
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/events', req.url));
    }
    
    // If not authenticated, redirect to login (unless already on a public route)
    if (!user) {
      // In a real app we'd redirect to /login
      // return NextResponse.redirect(new URL('/login', req.url));
      
      // For now, allow pass-through if testing locally without auth setup
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
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
