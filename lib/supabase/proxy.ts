import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export function validateNextPath(path: string): string {
  // Accept only internal paths starting with '/' and NOT '//'
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  return '/painel';
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // SECURITY: Use getUser() or getClaims() instead of getSession() for server-side authorization
  // getUser() is the most secure as it validates the JWT with the Supabase Auth server
  const { data: { user }, error } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    error,
    response,
  };
}
