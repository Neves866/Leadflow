import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, organizationId } = body;

    if (!pageId || !organizationId) {
      return NextResponse.json({ error: 'pageId and organizationId are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 1. Verify user is admin/owner of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (memberError || !membership || membership.role === 'member') {
      return NextResponse.json({ error: 'Unauthorized to manage integrations for this organization' }, { status: 403 });
    }

    // 2. Retrieve OAuth session server-side
    const adminSupabase = createAdminClient();
    const { data: session, error: sessionError } = await adminSupabase
      .from('integration_oauth_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'OAuth session not found or expired' }, { status: 404 });
    }

    const temp_data = session.temp_data as any;
    const pages = temp_data.pages || [];
    const selectedPage = pages.find((p: any) => p.id === pageId);

    if (!selectedPage) {
      return NextResponse.json({ error: 'Selected page not found in authorized list' }, { status: 400 });
    }

    // 3. Save Integration
    const { data: integration, error: intError } = await adminSupabase
      .from('integrations')
      .upsert({
        organization_id: organizationId,
        provider: 'meta',
        external_account_id: selectedPage.id,
        external_account_name: selectedPage.name,
        status: 'active',
      })
      .select()
      .single();

    if (intError) {
      console.error('[Meta Finalize] Integration Error:', intError);
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    // 4. Save Credentials (Page Access Token)
    const { error: credError } = await adminSupabase
      .from('integration_credentials')
      .upsert({
        integration_id: integration.id,
        credentials: { page_access_token: selectedPage.access_token },
      });

    if (credError) {
      console.error('[Meta Finalize] Credentials Error:', credError);
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
    }

    // 5. Subscribe Page to leadgen Webhook
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const subscribeUrl = `https://graph.facebook.com/${apiVersion}/${selectedPage.id}/subscribed_apps`;

    const subResponse = await fetch(subscribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: ['leadgen'],
        access_token: selectedPage.access_token,
      }),
    });

    if (!subResponse.ok) {
      const subError = await subResponse.json();
      console.error('[Meta Finalize] Webhook Subscription Error:', subError);
      // We don't fail the whole process, but we mark the integration as error
      await adminSupabase
        .from('integrations')
        .update({ status: 'error', metadata: { subscription_error: subError } })
        .eq('id', integration.id);
    }

    // 6. Cleanup OAuth Session
    await adminSupabase
      .from('integration_oauth_sessions')
      .delete()
      .eq('id', session.id);

    return NextResponse.json({
      status: 'success',
      integrationId: integration.id
    }, { status: 200 });

  } catch (err: any) {
    console.error('[Meta Finalize] Unexpected Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
