import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function safeText(value: unknown, maxLength = 500): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();

    const serviceId = typeof body?.serviceId === 'string' ? body.serviceId.trim() : '';
    const answers = body?.answers && typeof body.answers === 'object'
      ? body.answers as Record<string, unknown>
      : null;
    const metadataInput = body?.metadata && typeof body.metadata === 'object'
      ? body.metadata as Record<string, unknown>
      : {};

    if (!serviceId || !answers) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, organization_id, active')
      .eq('slug', slug)
      .single();

    if (formError || !form || !form.active) {
      return NextResponse.json({ error: 'Formulário não encontrado ou inativo.' }, { status: 404 });
    }

    const orgId = form.organization_id;
    const name = safeText(answers.name, 120) || '';
    const rawPhone = typeof answers.whatsapp === 'string' ? answers.whatsapp : '';
    const phone = rawPhone.replace(/\D/g, '');
    const email = safeText(answers.email, 160);

    if (name.length < 2 || phone.length < 10 || phone.length > 13) {
      return NextResponse.json({ error: 'Informe nome e WhatsApp válidos.' }, { status: 400 });
    }

    let { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .maybeSingle();

    if (contactError) throw contactError;

    if (!contact) {
      const { data: newContact, error: createContactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          name,
          phone,
          email,
        })
        .select('id')
        .single();

      if (createContactError) throw createContactError;
      contact = newContact;
    }

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('organization_id', orgId)
      .eq('key', serviceId)
      .eq('active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Serviço não encontrado ou inativo.' }, { status: 404 });
    }

    const { data: pipeline, error: pipeError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_default', true)
      .single();

    if (pipeError || !pipeline) {
      return NextResponse.json({ error: 'Pipeline padrão não encontrado.' }, { status: 500 });
    }

    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipeline.id)
      .eq('key', 'novo')
      .single();

    if (stageError || !stage) {
      return NextResponse.json({ error: 'Etapa inicial não encontrada.' }, { status: 500 });
    }

    const date = new Date();
    const protocol = `LF-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const leadSubject = (
      safeText(answers.problem, 120) ||
      safeText(answers.serviceType, 120) ||
      safeText(answers.category, 120) ||
      'Novo atendimento'
    );

    const urgencyRaw = safeText(answers.urgency, 20);
    const urgency = urgencyRaw && ['Baixa', 'Média', 'Alta'].includes(urgencyRaw)
      ? urgencyRaw
      : 'Média';

    const notes = safeText(answers.notes, 2000) || '';

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: orgId,
        contact_id: contact.id,
        service_id: service.id,
        form_id: form.id,
        pipeline_id: pipeline.id,
        stage_id: stage.id,
        title: `${name} - ${leadSubject}`.slice(0, 240),
        source: 'Public Form',
        urgency,
        protocol,
        notes,
      })
      .select('id')
      .single();

    if (leadError) throw leadError;

    const submissionMetadata = Object.fromEntries(
      Object.entries({
        landing_page: safeText(metadataInput.landingPage),
        referrer: safeText(metadataInput.referrer),
        utm_source: safeText(metadataInput.utmSource, 160),
        utm_medium: safeText(metadataInput.utmMedium, 160),
        utm_campaign: safeText(metadataInput.utmCampaign, 240),
        utm_content: safeText(metadataInput.utmContent, 240),
        utm_term: safeText(metadataInput.utmTerm, 240),
        user_agent: safeText(request.headers.get('user-agent')),
      }).filter(([, value]) => value !== null)
    );

    const { error: subError } = await supabase
      .from('form_submissions')
      .insert({
        organization_id: orgId,
        form_id: form.id,
        lead_id: lead.id,
        answers,
        metadata: submissionMetadata,
      });

    if (subError) throw subError;

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
      protocol,
    });
  } catch (error: any) {
    console.error('Submission Error:', error);
    return NextResponse.json(
      { error: 'Não foi possível registrar sua solicitação agora. Tente novamente.' },
      { status: 500 }
    );
  }
}
