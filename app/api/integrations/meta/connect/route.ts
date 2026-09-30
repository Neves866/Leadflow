import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    // 1. Authentication Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. Organization & Role Verification
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 403 });
    }

    if (membership.role === 'member') {
      return NextResponse.json({ error: 'Only admins and owners can connect integrations' }, { status: 403 });
    }

    const organizationId = membership.organization_id;
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_OAUTH_REDIRECT_URI;
    const apiVersion = process.env.META_API_VERSION || 'v18.0';

    if (!appId || !redirectUri) {
      return NextResponse.json({ error: 'Meta configuration is missing on the server' }, { status: 500 });
    }

    // 3. Secure State Generation
    const state = crypto.randomBytes(32).toString('hex');

    // 4. Store OAuth Session Server-Side (using Admin Client)
    const adminSupabase = createAdminClient();
    const { error: sessionError } = await adminSupabase.from('integration_oauth_sessions').insert({
      organization_id: organizationId,
      user_id: user.id,
      provider: 'meta',
      temp_data: { state },
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins
    });

    if (sessionError) {
      console.error('[Meta Connect] Session Error:', sessionError);
      return NextResponse.json({ error: 'Failed to initialize connection session' }, { status: 500 });
    }

    // 5. Set state cookie for CSRF protection
    cookieStore.set('meta_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    // Scopes for Facebook Login for Business
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'leads_retrieval',
      'public_profile',
      'business_management'
    ].join(',');

    const metaAuthUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes}&response_type=code&state=${state}`;

    return NextResponse.redirect(metaAuthUrl);
  } catch (err: any) {
    console.error('[Meta Connect] Unexpected Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
    