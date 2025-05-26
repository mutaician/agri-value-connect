import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Define paths that require authentication
const protectedPaths = ['/dashboard', '/profile', '/my-listings', '/products/new'];

export async function middleware(request: NextRequest) {
  console.log('Middleware running for:', request.nextUrl.pathname);
  
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // If user is not logged in and trying to access a protected path, redirect to login
  if (!user && protectedPaths.some(path => pathname.startsWith(path))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;

  /* COMMENTED OUT FOR TESTING - UNCOMMENT AFTER BASIC TEST PASSES
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Ensure cookies are set on the response, not the request
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Ensure cookies are set on the response, not the request
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // If session exists but is expired, try to refresh it
  if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
    await supabase.auth.refreshSession();
  }
  
  // Get user after potentially refreshing the session
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  
  // Get base URL from request headers or use environment variable as fallback
  const getBaseURL = () => {
    // Use the host header to construct the base URL
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    if (host) {
      return `${protocol}://${host}`;
    }
    
    // Fallback to environment variable or default
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://agri-value-connect.vercel.app';
  };
  
  // Create a safe URL for redirects
  const createRedirectURL = (path: string) => {
    const baseUrl = getBaseURL();
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // If user is not logged in and trying to access a protected path, redirect to login
  if (!user && protectedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(createRedirectURL('/login'));
  }

  // If user is logged in and trying to access login/signup, redirect to home (already handled by page server components, but good for defense-in-depth)
  // if (user && authRoutes.some(path => pathname.startsWith(path))) {
  //   return NextResponse.redirect(createRedirectURL('/'));
  // }

  return response;
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 