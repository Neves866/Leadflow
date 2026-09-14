import { NextRequest, NextResponse } from 'next/server';
import { updateSession, validateNextPath } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Define routing rules
  const isPainelRoute = pathname.startsWith('/painel');
  const isLoginRoute = pathname === '/login';
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/f/') ||
    pathname === '/formulario/demo' ||
    pathname === '/sucesso' ||
    isLoginRoute;

  // 2. Handle Session Update & User Validation
  const { user, response } = await updateSession(request);

  // Case A: Accessing protected route without session
  if (isPainelRoute && !user) {
    const fullPath = pathname + search;
    const safeNext = validateNextPath(fullPath);

    const url = new URL(request.url);
    url.pathname = '/login';
    url.searchParams.set('next', safeNext);

    return NextResponse.redirect(url);
  }

  // Case B: Accessing login page while already authenticated
  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL('/painel', request.url));
  }

  // Case C: All other requests (Public or Authenticated protected)
  // Return the response with updated session cookies
  return response;
}
