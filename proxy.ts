import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  // 1. Define protected routes
  const isPainelRoute = request.nextUrl.pathname.startsWith('/painel');
  const isLoginRoute = request.nextUrl.pathname === '/login';
  const isPublicRoute =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/f/') ||
    request.nextUrl.pathname === '/formulario/demo' ||
    request.nextUrl.pathname === '/sucesso' ||
    isLoginRoute;

  // 2. Create Supabase Server Client to check session
  // We use the cookies from the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // In proxy, we can't set cookies directly on the request
          // We'll need to handle this in the response
        },
        remove(name: string, options: any) {
          // Similarly for remove
        },
      },
    }
  );

  // 3. Validate session
  const { data: { session } } = await supabase.auth.getSession();

  // Case A: Accessing protected route without session
  if (isPainelRoute && !session) {
    const next = request.nextUrl.searchParams.get('next') || '/painel';
    const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/painel';

    const url = new URL(request.url);
    url.pathname = '/login';
    url.searchParams.set('next', safeNext);

    return NextResponse.redirect(url);
  }

  // Case B: Accessing login page while already authenticated
  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL('/painel', request.url));
  }

  // Case C: All other requests (Public or Authenticated protected)
  return null; // Continue to next handler
}
