import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { serviceId, answers } = body;

    if (!serviceId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Find the form and organization
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, organization_id, active')
      .eq('slug', slug)
      .single();

    if (formError || !form || !form.active) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
    }

    const orgId = form.organization_id;

    // 2. Contact Management
    const name = answers.name;
    const rawPhone = answers.whatsapp || '';
    const phone = rawPhone.replace(/\D/g, '');

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and WhatsApp are required' }, { status: 400 });
    }

    let { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .single();

    if (contactError || !contact) {
      const { data: newContact, error: createContactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          name,
          phone,
        })
        .select()
        .single();

      if (createContactError) throw createContactError;
      contact = newContact;
    }

    // 3. Service Resolution (serviceId is the KEY, e.g., 'ar')
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('organization_id', orgId)
      .eq('key', serviceId)
      .eq('active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found or inactive' }, { status: 404 });
    }

    // 4. Pipeline and Stage
    const { data: pipeline, error: pipeError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_default', true)
      .single();

    if (pipeError || !pipeline) {
      return NextResponse.json({ error: 'Default pipeline not found' }, { status: 500 });
    }

    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipeline.id)
      .eq('key', 'novo')
      .single();

    if (stageError || !stage) {
      return NextResponse.json({ error: 'Initial stage "novo" not found' }, { status: 500 });
    }

    // 5. Protocol Generation
    const date = new Date();
    const protocol = `LF-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Lead Creation
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: orgId,
        contact_id: contact.id,
        service_id: service.id,
        form_id: form.id,
        pipeline_id: pipeline.id,
        stage_id: stage.id,
        title: `${name} - ${answers.serviceType || 'Lead'}`,
        source: 'Public Form',
        urgency: answers.urgency || 'Média',
        protocol: protocol,
        notes: answers.notes || '',
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // 7. Submission Recording
    const { error: subError } = await supabase
      .from('form_submissions')
      .insert({
        organization_id: orgId,
        form_id: form.id,
        lead_id: lead.id,
        answers: answers,
      });

    if (subError) throw subError;

    // 8. Activity Log
    const { error: actError } = await supabase
      .from('activities')
      .insert({
        organization_id: orgId,
        lead_id: lead.id,
        type: 'lead_created',
        data: { protocol, source: 'Public Form' },
      });

    if (actError) throw actError;

    return NextResponse.json({
      success: true,
      protocol: protocol,
      leadId: lead.id,
    });

  } catch (error: any) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
