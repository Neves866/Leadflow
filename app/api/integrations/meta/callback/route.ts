import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { status: 'error', error: `Meta OAuth Error: ${error}`, code: 'META_OAUTH_ERROR' },
        { status: 400 }
      );
    }

    // 1. CSRF Validation
    const cookieStore = await cookies();
    const storedState = cookieStore.get('meta_oauth_state')?.value;

    if (!state || !storedState || state !== storedState) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid state parameter', code: 'META_OAUTH_CSRF_ERROR' },
        { status: 400 }
      );
    }

    // Clear state cookie immediately after validation
    cookieStore.delete('meta_oauth_state');

    if (!code) {
      return NextResponse.json(
        { status: 'error', error: 'No authorization code received', code: 'META_OAUTH_ERROR' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;
      const redirectUri = process.env.META_OAUTH_REDIRECT_URI;
      const apiVersion = process.env.META_API_VERSION || 'v18.0';

      if (!appId || !appSecret || !redirectUri) {
        return NextResponse.json(
          { status: 'error', error: 'Meta configuration is missing on the server', code: 'META_CONFIG_ERROR' },
          { status: 500 }
        );
      }

      // 2. Exchange code for User Access Token
      const tokenExchangeUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
      const tokenResponse = await fetch(tokenExchangeUrl);
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        return NextResponse.json(
          {
            status: 'error',
            error: tokenData.error?.message || 'Failed to exchange code for access token',
            code: 'META_TOKEN_EXCHANGE_ERROR'
          },
          { status: tokenResponse.status || 400 }
        );
      }

      const userAccessToken = tokenData.access_token;

      // 3. Get Managed Pages
      const pagesUrl = `https://graph.facebook.com/${apiVersion}/me/accounts?fields=id,name,access_token,tasks&access_token=${userAccessToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (!pagesResponse.ok || !pagesData.data) {
        return NextResponse.json(
          {
            status: 'error',
            error: pagesData.error?.message || 'Failed to fetch managed pages',
            code: 'META_PAGES_FETCH_ERROR'
          },
          { status: pagesResponse.status || 400 }
        );
      }

      // 4. Store sensitive data in OAuth Session server-side
      const adminSupabase = createAdminClient();

      // Find session by state (stored in temp_data.state)
      const { data: session, error: sessionError } = await adminSupabase
        .from('integration_oauth_sessions')
        .select('*')
        .eq('temp_data->>state', state)
        .maybeSingle();

      if (sessionError || !session) {
        return NextResponse.json({ error: 'OAuth session not found or expired' }, { status: 404 });
      }

      // Save User Access Token and Page Tokens temporarily
      const temp_data = {
        user_access_token: userAccessToken,
        pages: pagesData.data.map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          tasks: page.tasks,
        })),
      };

      const { error: updateError } = await adminSupabase
        .from('integration_oauth_sessions')
        .update({ temp_data })
        .eq('id', session.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to save temporary session data' }, { status: 500 });
      }

      // 5. Return ONLY non-sensitive data to the frontend
      const filteredPages = pagesData.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        tasks: page.tasks,
      }));

      return NextResponse.json({
        status: 'success',
        pages: filteredPages,
        sessionId: session.id,
      }, { status: 200 });

    } catch (err: any) {
      console.error('Meta OAuth Callback Error:', err);
      return NextResponse.json(
        { status: 'error', error: 'An unexpected error occurred during Meta authentication', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[Meta Callback] Unexpected Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
