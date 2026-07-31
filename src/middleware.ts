import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Immediately bypass public pre-registration routes without initializing Supabase client
  // Matches: /events/{slug}/register
  const isPublicRegistration = /^\/events\/[^/]+\/register\/?$/.test(pathname);
  if (isPublicRegistration) {
    return NextResponse.next();
  }

  // 2. Handle root route redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/events', req.url));
  }

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/events');
  const isLoginRoute = pathname === '/login';

  // 3. Immediately bypass non-protected and non-login routes
  if (!isProtected && !isLoginRoute) {
    return NextResponse.next();
  }

  // 4. Initialize Supabase client ONLY for routes that require authentication
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

  // 5. Protect /dashboard and administrative /events routes
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

  // 6. Prevent logged-in users from seeing the login page
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