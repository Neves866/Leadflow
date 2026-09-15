'use client';

import styles from "./details.module.css";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

        // 1. Fetch lead with relations
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

        // 2. Fetch stages, services, activities and members in parallel
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

        // Map to UI format
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

        // Initialize editable fields
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

      // 1. Update lead stage
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

      // 2. Create activity
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

      // 1. Update the opportunity fields of this lead only
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

      // 2. Create activity
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

      // 1. Update notes of this lead only
      const { error: updateError } = await supabase
        .from('leads')
        .update({ notes: notesDraft })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      // 2. Create activity
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

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando detalhes do lead...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className={styles.container}>
        <p>Lead não encontrado.</p>
        <button onClick={() => router.back()}>Voltar</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá ${lead.nome}, vi seu interesse em ${lead.servico} no LeadFlow.`);
    const digits = lead.telefone.replace(/\D/g, '');
    let normalizedPhone = digits;
    if (digits.length === 10 || digits.length === 11) {
      normalizedPhone = `55${digits}`;
    }
    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, '_blank');
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Voltar para Leads
        </button>
        <div className={styles.actions}>
          <button className={styles.whatsappButton} onClick={handleWhatsApp}>
            WhatsApp
          </button>
          <select
            className={styles.statusButton}
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {stages.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Cliente</h2>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Nome</p>
            <p className={styles.value}>{lead.nome}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Telefone</p>
            <p className={styles.value}>{lead.telefone}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Email</p>
            <p className={styles.value}>{lead.email || 'Não informado'}</p>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Oportunidade</h2>
          <div className={styles.editField}>
            <label htmlFor="editService">Serviço</label>
            <select id="editService" value={editServiceId} onChange={e => setEditServiceId(e.target.value)}>
              <option value="">Sem serviço</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.editField}>
            <label htmlFor="editSource">Origem</label>
            <select id="editSource" value={editSource} onChange={e => setEditSource(e.target.value)}>
              <option value="">Não informada</option>
              {SOURCE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className={styles.editField}>
            <label htmlFor="editUrgency">Urgência</label>
            <select id="editUrgency" value={editUrgency} onChange={e => setEditUrgency(e.target.value)}>
              {URGENCY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className={styles.editField}>
            <label htmlFor="editValue">Valor Potencial</label>
            <input
              id="editValue"
              type="text"
              inputMode="decimal"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              placeholder="Ex: 1500,00"
            />
          </div>
          <div className={styles.editField}>
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
          <div className={styles.infoGroup}>
            <p className={styles.label}>Data</p>
            <p className={styles.value}>{lead.data}</p>
          </div>
          <div className={styles.actionRow}>
            <button className={styles.saveButton} onClick={handleSaveOpportunity} disabled={savingOpportunity}>
              {savingOpportunity ? 'Salvando...' : 'Salvar alterações'}
            </button>
            {opportunityFeedback && (
              <span className={opportunityFeedback.ok ? styles.feedbackOk : styles.feedbackError}>
                {opportunityFeedback.text}
              </span>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Status Atual</h2>
          <div className={styles.statusWrapper}>
            <span className={styles.statusBadge}>{lead.status}</span>
          </div>
        </section>
      </div>

      <section className={`${styles.card} ${styles.fullWidth}`}>
        <h2 className={styles.cardTitle}>Respostas do Formulário</h2>
        <div className={styles.responses}>
          {lead.respostas && Object.entries(lead.respostas).length > 0 ? (
            <>
              {Object.entries(lead.respostas).map(([key, value]: [string, any]) => (
                <div key={key} className={styles.responseItem}>
                  <p className={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className={styles.value}>{String(value)}</p>
                </div>
              ))}
            </>
          ) : (
            <p>Nenhuma resposta registrada.</p>
          )}
        </div>
      </section>

      <section className={`${styles.card} ${styles.fullWidth}`}>
        <h2 className={styles.cardTitle}>Observações Internas</h2>
        <textarea
          className={styles.notesArea}
          value={notesDraft}
          onChange={e => setNotesDraft(e.target.value)}
          placeholder="Adicione notas sobre este lead..."
        />
        <div className={styles.actionRow}>
          <button className={styles.saveButton} onClick={handleSaveNotes} disabled={savingNotes}>
            {savingNotes ? 'Salvando...' : 'Salvar observações'}
          </button>
          {notesFeedback && (
            <span className={notesFeedback.ok ? styles.feedbackOk : styles.feedbackError}>
              {notesFeedback.text}
            </span>
          )}
        </div>
      </section>

      <section className={`${styles.card} ${styles.fullWidth}`}>
        <h2 className={styles.cardTitle}>Histórico de Atividades</h2>
        <div className={styles.timeline}>
          {lead.activities && lead.activities.length > 0 ? (
            lead.activities.map((act: ActivityRecord) => (
              <div key={act.id} className={styles.timelineItem}>
                <div className={styles.dot} />
                <div className={styles.timelineContent}>
                  <p className={styles.time}>
                    {new Date(act.created_at).toLocaleString('pt-BR')}
                  </p>
                  <p>{describeActivity(act)}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhuma atividade registrada.</p>
          )}
        </div>
      </section>
    </main>
  );
}