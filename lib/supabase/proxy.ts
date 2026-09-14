import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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
        setAll(cookiesToSet, headers) {
          // 1. Update request cookies so subsequent calls in the same request see the update
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // 2. Recreate the response to ensure it carries updated request state
          response = NextResponse.next({
            request,
          });

          // 3. Copy updated cookies to the response
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );

          // 4. Preserve headers provided by @supabase/ssr (e.g. for session refresh)
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              response.headers.set(key, value)
            );
          }
        },
      },
    }
  );

  // SECURITY: Use getUser() instead of getSession() for server-side authorization
  const { data: { user }, error } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    error,
    response,
  };
}

/**
 * Helper to create a redirect response that preserves
 * session cookies and headers from the Supabase response.
 */
export function createRedirectResponse(url: string, baseResponse: NextResponse) {
  const response = NextResponse.redirect(url);

  // Copy ALL cookies with full options from the baseResponse
  baseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  });

  // Copy all headers from baseResponse EXCEPT location and set-cookie
  // (cookies are already handled by response.cookies.set)
  baseResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'location' && lowerKey !== 'set-cookie') {
      response.headers.set(key, value);
    }
  });

  return response;
}
