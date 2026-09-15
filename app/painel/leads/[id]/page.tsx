'use client';

import styles from './details.module.css';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Save,
  Sparkles,
  StickyNote,
  UserCheck,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const SOURCE_OPTIONS = ['WhatsApp', 'Ligação', 'Indicação', 'Instagram', 'Facebook', 'Google', 'Site', 'Outro'];
const URGENCY_OPTIONS = ['Baixa', 'Média', 'Alta'];

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
};

interface LeadData {
  id: string;
  organizationId: string;
  pipelineId: string;
  serviceId: string | null;
  assignedUserId: string | null;
  nome: string;
  telefone: string;
  email: string;
  servico: string;
  origem: string;
  urgencia: string;
  data: string;
  valorPotencial: number | null;
  status: string;
  observacoes: string;
  respostas: any;
  activities: ActivityRecord[];
}

interface ActivityRecord {
  id: string;
  type: string;
  data: any;
  created_at: string;
}

interface ServiceOption {
  id: string;
  name: string;
}

interface MemberOption {
  userId: string;
  name: string;
  role: string;
}

function describeActivity(act: ActivityRecord): string {
  switch (act.type) {
    case 'lead_created':
      return 'Lead criado via formulário público.';
    case 'lead_created_manual':
      return 'Lead criado manualmente.';
    case 'status_changed':
      return `Status alterado de ${act.data?.from ?? '—'} para ${act.data?.to ?? '—'}.`;
    case 'lead_updated':
      return 'Dados da oportunidade atualizados.';
    case 'notes_updated':
      return 'Observações internas atualizadas.';
    default:
      return 'Atividade registrada.';
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatCurrency(value: number | null) {
  if (value == null) return 'A definir';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

function activityIcon(type: string) {
  if (type === 'status_changed') return <CheckCircle2 size={15} />;
  if (type === 'notes_updated') return <StickyNote size={15} />;
  if (type === 'lead_updated') return <Save size={15} />;
  return <Sparkles size={15} />;
}

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);

  const [editServiceId, setEditServiceId] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editUrgency, setEditUrgency] = useState('Média');
  const [editValue, setEditValue] = useState('');
  const [editAssigned, setEditAssigned] = useState('');
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [opportunityFeedback, setOpportunityFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesFeedback, setNotesFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    async function fetchLeadDetails() {
      if (!id) return;
      setLoading(true);
      try {
        const supabase = createClient();

        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select(`
            id,
            organization_id,
            pipeline_id,
            service_id,
            assigned_user_id,
            created_at,
            potential_value,
            notes,
            urgency,
            source,
            contacts ( name, phone, email ),
            services ( name ),
            pipeline_stages ( name ),
            form_submissions ( answers )
          `)
          .eq('id', id)
          .single();

        if (leadError || !leadData) throw leadError || new Error('Lead not found');

        const organizationId = leadData.organization_id;

        const [stagesRes, servicesRes, activitiesRes, membersRes] = await Promise.all([
          supabase.from('pipeline_stages').select('id, name').eq('pipeline_id', leadData.pipeline_id),
          supabase
            .from('services')
            .select('id, name, active, sort_order')
            .eq('organization_id', organizationId)
            .eq('active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('activities')
            .select('*')
            .eq('lead_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('organization_members')
            .select('user_id, role')
            .eq('organization_id', organizationId),
        ]);

        if (stagesRes.error) throw stagesRes.error;

        setStages(stagesRes.data ?? []);
        setServices((servicesRes.data ?? []) as ServiceOption[]);

        const userIds = (membersRes.data ?? []).map(member => member.user_id);
        const memberOptions: MemberOption[] = [];

        if (userIds.length > 0) {
          const profilesRes = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (profilesRes.error) throw profilesRes.error;

          const profileNames = new Map(
            (profilesRes.data ?? []).map(profile => [profile.id, profile.full_name])
          );

          for (const member of membersRes.data ?? []) {
            memberOptions.push({
              userId: member.user_id,
              name: profileNames.get(member.user_id) || 'Usuário',
              role: ROLE_LABELS[member.role] ?? member.role,
            });
          }
        }

        setMembers(memberOptions);

        setLead({
          id: leadData.id,
          organizationId,
          pipelineId: leadData.pipeline_id,
          serviceId: leadData.service_id || null,
          assignedUserId: leadData.assigned_user_id || null,
          nome: (leadData.contacts as any)?.name || 'Sem nome',
          telefone: (leadData.contacts as any)?.phone || '',
          email: (leadData.contacts as any)?.email || '',
          servico: (leadData.services as any)?.name || 'Sem serviço',
          origem: leadData.source || '',
          urgencia: leadData.urgency || 'Média',
          data: new Date(leadData.created_at).toLocaleDateString('pt-BR'),
          valorPotencial: leadData.potential_value != null ? Number(leadData.potential_value) : null,
          status: (leadData.pipeline_stages as any)?.name || 'Novo',
          observacoes: leadData.notes || '',
          respostas: (leadData.form_submissions as any)?.[0]?.answers || {},
          activities: (activitiesRes.data ?? []) as ActivityRecord[],
        });

        setEditServiceId(leadData.service_id || '');
        setEditSource(leadData.source || '');
        setEditUrgency(leadData.urgency || 'Média');
        setEditValue(leadData.potential_value != null ? String(leadData.potential_value) : '');
        setEditAssigned(leadData.assigned_user_id || '');
        setNotesDraft(leadData.notes || '');
      } catch (err) {
        console.error('Error fetching lead details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeadDetails();
  }, [id]);

  const handleStatusChange = async (newStatusName: string) => {
    if (!lead) return;

    const stage = stages.find(s => s.name === newStatusName);
    if (!stage) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('leads')
        .update({ stage_id: stage.id })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      const newActivity: ActivityRecord = {
        id: `local-${Date.now()}`,
        type: 'status_changed',
        data: { from: lead.status, to: newStatusName },
        created_at: new Date().toISOString(),
      };

      const { error: actError } = await supabase
        .from('activities')
        .insert({
          organization_id: lead.organizationId,
          lead_id: lead.id,
          actor_user_id: user?.id,
          type: newActivity.type,
          data: newActivity.data,
        });

      if (actError) throw actError;

      setLead({
        ...lead,
        status: newStatusName,
        activities: [newActivity, ...lead.activities],
      });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status.');
    }
  };

  const handleSaveOpportunity = async () => {
    if (!lead || savingOpportunity) return;

    const newValue = editValue.trim() === '' ? null : Number(editValue.replace(',', '.'));

    if (editValue.trim() !== '' && Number.isNaN(newValue as number)) {
      setOpportunityFeedback({ ok: false, text: 'Valor potencial inválido.' });
      return;
    }

    setOpportunityFeedback(null);
    setSavingOpportunity(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const newServiceId = editServiceId || null;
      const newAssignedUserId = editAssigned || null;
      const changedFields: string[] = [];

      if ((newServiceId ?? null) !== (lead.serviceId ?? null)) changedFields.push('service_id');
      if (editSource !== (lead.origem ?? '')) changedFields.push('source');
      if (editUrgency !== lead.urgencia) changedFields.push('urgency');
      if ((newValue ?? null) !== (lead.valorPotencial ?? null)) changedFields.push('potential_value');
      if ((newAssignedUserId ?? null) !== (lead.assignedUserId ?? null)) changedFields.push('assigned_user_id');

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          service_id: newServiceId,
          source: editSource || null,
          urgency: editUrgency,
          potential_value: newValue,
          assigned_user_id: newAssignedUserId,
        })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      const activityData = { fields: changedFields };
      const { error: actError } = await supabase
        .from('activities')
        .insert({
          organization_id: lead.organizationId,
          lead_id: lead.id,
          actor_user_id: user?.id,
          type: 'lead_updated',
          data: activityData,
        });

      if (actError) throw actError;

      const serviceName = services.find(service => service.id === newServiceId)?.name || 'Sem serviço';

      setLead({
        ...lead,
        serviceId: newServiceId,
        origem: editSource,
        urgencia: editUrgency,
        valorPotencial: newValue,
        assignedUserId: newAssignedUserId,
        servico: serviceName,
        activities: [
          {
            id: `local-${Date.now()}`,
            type: 'lead_updated',
            data: activityData,
            created_at: new Date().toISOString(),
          },
          ...lead.activities,
        ],
      });

      setOpportunityFeedback({ ok: true, text: 'Alterações salvas.' });
    } catch (err) {
      console.error('Error saving opportunity:', err);
      setOpportunityFeedback({ ok: false, text: 'Não foi possível salvar as alterações.' });
    } finally {
      setSavingOpportunity(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!lead || savingNotes) return;

    setNotesFeedback(null);
    setSavingNotes(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('leads')
        .update({ notes: notesDraft })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      const { error: actError } = await supabase
        .from('activities')
        .insert({
          organization_id: lead.organizationId,
          lead_id: lead.id,
          actor_user_id: user?.id,
          type: 'notes_updated',
          data: {},
        });

      if (actError) throw actError;

      setLead({
        ...lead,
        observacoes: notesDraft,
        activities: [
          {
            id: `local-${Date.now()}`,
            type: 'notes_updated',
            data: {},
            created_at: new Date().toISOString(),
          },
          ...lead.activities,
        ],
      });

      setNotesFeedback({ ok: true, text: 'Observações salvas.' });
    } catch (err) {
      console.error('Error saving notes:', err);
      setNotesFeedback({ ok: false, text: 'Não foi possível salvar as alterações.' });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleWhatsApp = () => {
    if (!lead) return;
    const message = encodeURIComponent(`Olá ${lead.nome}, vi seu interesse em ${lead.servico} no LeadFlow.`);
    const digits = lead.telefone.replace(/\D/g, '');
    let normalizedPhone = digits;
    if (digits.length === 10 || digits.length === 11) normalizedPhone = `55${digits}`;
    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, '_blank');
  };

  const assignedMember = useMemo(
    () => members.find(member => member.userId === lead?.assignedUserId),
    [members, lead?.assignedUserId]
  );

  if (loading) {
    return (
      <div className={styles.statePage}>
        <div className={styles.statePulse} />
        <p>Carregando oportunidade...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className={styles.statePage}>
        <p>Lead não encontrado.</p>
        <button onClick={() => router.back()}>Voltar</button>
      </div>
    );
  }

  const currentStageIndex = stages.findIndex(stage => stage.name === lead.status);

  return (
    <main className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Leads
        </button>
        <div className={styles.actions}>
          <button className={styles.whatsappButton} onClick={handleWhatsApp} disabled={!lead.telefone}>
            <MessageCircle size={17} />
            WhatsApp
          </button>
          <select
            className={styles.statusSelect}
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {stages.map(stage => (
              <option key={stage.id} value={stage.name}>{stage.name}</option>
            ))}
          </select>
        </div>
      </div>

      <header className={styles.hero}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{getInitials(lead.nome)}</div>
          <div>
            <div className={styles.eyebrow}>OPORTUNIDADE</div>
            <h1>{lead.nome}</h1>
            <div className={styles.heroMeta}>
              <span><BriefcaseBusiness size={14} /> {lead.servico}</span>
              <span><CalendarDays size={14} /> criada em {lead.data}</span>
            </div>
          </div>
        </div>
        <div className={styles.heroBadges}>
          <span className={styles.sourceBadge}>{lead.origem || 'Origem não informada'}</span>
          <span className={`${styles.urgencyBadge} ${styles[`urgency${lead.urgencia}`] || ''}`}>
            {lead.urgencia}
          </span>
        </div>
      </header>

      <section className={styles.stageRail} aria-label="Etapas do pipeline">
        {stages.map((stage, index) => {
          const isCurrent = stage.name === lead.status;
          const isPast = currentStageIndex >= 0 && index < currentStageIndex;
          return (
            <button
              key={stage.id}
              className={`${styles.stageStep} ${isCurrent ? styles.stageCurrent : ''} ${isPast ? styles.stagePast : ''}`}
              onClick={() => handleStatusChange(stage.name)}
              type="button"
            >
              <span className={styles.stageDot}>{isPast ? <CheckCircle2 size={13} /> : index + 1}</span>
              <span>{stage.name}</span>
            </button>
          );
        })}
      </section>

      <div className={styles.workspace}>
        <div className={styles.primaryColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelKicker}>OPORTUNIDADE</span>
                <h2>Dados comerciais</h2>
              </div>
              <BriefcaseBusiness size={19} />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.editField}>
                <label htmlFor="editService">Serviço</label>
                <select id="editService" value={editServiceId} onChange={e => setEditServiceId(e.target.value)}>
                  <option value="">Sem serviço</option>
                  {services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </div>

              <div className={styles.editField}>
                <label htmlFor="editSource">Origem</label>
                <select id="editSource" value={editSource} onChange={e => setEditSource(e.target.value)}>
                  <option value="">Não informada</option>
                  {SOURCE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              <div className={styles.editField}>
                <label htmlFor="editUrgency">Urgência</label>
                <select id="editUrgency" value={editUrgency} onChange={e => setEditUrgency(e.target.value)}>
                  {URGENCY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              <div className={styles.editField}>
                <label htmlFor="editValue">Valor potencial</label>
                <input
                  id="editValue"
                  type="text"
                  inputMode="decimal"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="Ex: 1500,00"
                />
              </div>

              <div className={`${styles.editField} ${styles.fieldWide}`}>
                <label htmlFor="editAssigned">Responsável</label>
                <select id="editAssigned" value={editAssigned} onChange={e => setEditAssigned(e.target.value)}>
                  <option value="">Sem responsável</option>
                  {members.map(member => (
                    <option key={member.userId} value={member.userId}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.saveRow}>
              <button className={styles.primaryButton} onClick={handleSaveOpportunity} disabled={savingOpportunity}>
                <Save size={16} />
                {savingOpportunity ? 'Salvando...' : 'Salvar alterações'}
              </button>
              {opportunityFeedback && (
                <span className={opportunityFeedback.ok ? styles.feedbackOk : styles.feedbackError}>
                  {opportunityFeedback.text}
                </span>
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelKicker}>CONTEXTO</span>
                <h2>Observações internas</h2>
              </div>
              <StickyNote size={19} />
            </div>
            <textarea
              className={styles.notesArea}
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              placeholder="Registre objeções, próximos passos e informações importantes sobre esta oportunidade..."
            />
            <div className={styles.saveRow}>
              <button className={styles.secondaryButton} onClick={handleSaveNotes} disabled={savingNotes}>
                <Save size={16} />
                {savingNotes ? 'Salvando...' : 'Salvar observações'}
              </button>
              {notesFeedback && (
                <span className={notesFeedback.ok ? styles.feedbackOk : styles.feedbackError}>
                  {notesFeedback.text}
                </span>
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelKicker}>CAPTAÇÃO</span>
                <h2>Respostas do formulário</h2>
              </div>
              <FileText size={19} />
            </div>
            {lead.respostas && Object.entries(lead.respostas).length > 0 ? (
              <div className={styles.responses}>
                {Object.entries(lead.respostas).map(([key, value]: [string, any]) => (
                  <div key={key} className={styles.responseItem}>
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>Nenhuma resposta registrada para esta oportunidade.</div>
            )}
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={`${styles.panel} ${styles.commandPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelKicker}>COMMAND CENTER</span>
                <h2>Visão rápida</h2>
              </div>
              <Sparkles size={19} />
            </div>

            <div className={styles.metricHero}>
              <span>Valor potencial</span>
              <strong>{formatCurrency(lead.valorPotencial)}</strong>
              <small>pipeline atual</small>
            </div>

            <div className={styles.quickGrid}>
              <div className={styles.quickItem}>
                <span className={styles.quickIcon}><UserCheck size={16} /></span>
                <div><small>Responsável</small><strong>{assignedMember?.name || 'Sem responsável'}</strong></div>
              </div>
              <div className={styles.quickItem}>
                <span className={styles.quickIcon}><Activity size={16} /></span>
                <div><small>Status</small><strong>{lead.status}</strong></div>
              </div>
              <div className={styles.quickItem}>
                <span className={styles.quickIcon}><CircleDollarSign size={16} /></span>
                <div><small>Origem</small><strong>{lead.origem || 'Não informada'}</strong></div>
              </div>
              <div className={styles.quickItem}>
                <span className={styles.quickIcon}><Clock3 size={16} /></span>
                <div><small>Urgência</small><strong>{lead.urgencia}</strong></div>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelKicker}>CONTATO</span>
                <h2>Cliente</h2>
              </div>
              <UserRound size={19} />
            </div>
            <div className={styles.contactProfile}>
              <div className={styles.contactAvatar}>{getInitials(lead.nome)}</div>
              <div><strong>{lead.nome}</strong><span>{lead.servico}</span></div>
            </div>
            <div className={styles.contactRows}>
              <div><Phone size={15} /><span>{lead.telefone || 'Não informado'}</span></div>
              <div><Mail size={15} /><span>{lead.email || 'Não informado'}</span></div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.timelinePanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelKicker}>HISTÓRICO</span>
                <h2>Atividades</h2>
              </div>
              <Activity size={19} />
            </div>
            <div className={styles.timeline}>
              {lead.activities.length > 0 ? lead.activities.map((act) => (
                <div key={act.id} className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>{activityIcon(act.type)}</div>
                  <div className={styles.timelineContent}>
                    <strong>{describeActivity(act)}</strong>
                    <span>{new Date(act.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>Nenhuma atividade registrada.</div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
