import { NextRequest, NextResponse } from 'next/server';
import { updateSession, createRedirectResponse } from '@/lib/supabase/proxy';
import { getSafeNextPath } from '@/lib/auth/redirect';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Routing Rules
  const isPainelRoute = pathname.startsWith('/painel');
  const isLoginRoute = pathname === '/login';

  // 2. Handle Session Update & User Validation
  const { user, response } = await updateSession(request);

  // Case A: Accessing protected route without session
  if (isPainelRoute && !user) {
    const fullPath = pathname + search;
    const safeNext = getSafeNextPath(fullPath);

    const url = new URL(request.url);
    url.pathname = '/login';
    url.searchParams.set('next', safeNext);

    return createRedirectResponse(url.toString(), response);
  }

  // Case B: Accessing login page while already authenticated
  if (isLoginRoute && user) {
    return createRedirectResponse(new URL('/painel', request.url).toString(), response);
  }

  // Case C: All other requests (Public or Authenticated protected)
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
