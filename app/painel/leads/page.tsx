'use client';

import styles from "./leads.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Lead {
  id: string;
  organizationId: string;
  pipelineId: string;
  stageId: string;
  stageName: string;
  createdAt: string;
  potentialValue: number | null;
  source: string;
  urgency: string;
  assignedUserId: string | null;
  nome: string;
  servico: string;
  origem: string;
  status: string;
  valorPotencial: number;
}

interface Stage {
  id: string;
  pipeline_id: string;
  organization_id: string;
  key: string;
  name: string;
  sort_order: number;
  is_closed: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function LeadsPage() {
  const router = useRouter();

  const [view, setView] = useState<'lista' | 'funil'>('lista');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os status');
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropTargetStageId, setDropTargetStageId] = useState<string | null>(null);
  const [kanbanFeedback, setKanbanFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Authenticated user + organization
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Usuário não autenticado');

        const { data: membershipData, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (membershipError) throw membershipError;

        const organizationId = membershipData?.[0]?.organization_id;
        if (!organizationId) throw new Error('Organização não encontrada para o usuário');

        // 2. Default pipeline
        const { data: pipeline, error: pipelineError } = await supabase
          .from('pipelines')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('is_default', true)
          .maybeSingle();

        if (pipelineError) throw pipelineError;
        if (!pipeline) throw new Error('Pipeline padrão não encontrado');

        // 3. Leads + stages of the default pipeline
        const [leadsRes, stagesRes] = await Promise.all([
          supabase
            .from('leads')
            .select(`
              id,
              organization_id,
              pipeline_id,
              stage_id,
              created_at,
              potential_value,
              source,
              urgency,
              assigned_user_id,
              contacts ( name ),
              services ( name ),
              pipeline_stages ( id, name )
            `)
            .eq('pipeline_id', pipeline.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('pipeline_stages')
            .select('id, pipeline_id, organization_id, key, name, sort_order, is_closed')
            .eq('pipeline_id', pipeline.id)
            .order('sort_order', { ascending: true }),
        ]);

        if (leadsRes.error) throw leadsRes.error;
        if (stagesRes.error) throw stagesRes.error;

        const mappedLeads: Lead[] = (leadsRes.data ?? []).map((lead: any) => ({
          id: lead.id,
          organizationId: lead.organization_id,
          pipelineId: lead.pipeline_id,
          stageId: lead.stage_id,
          stageName: (lead.pipeline_stages as any)?.name || '',
          createdAt: lead.created_at,
          potentialValue: lead.potential_value != null ? Number(lead.potential_value) : null,
          source: lead.source || '',
          urgency: lead.urgency || 'Média',
          assignedUserId: lead.assigned_user_id || null,
          nome: (lead.contacts as any)?.name || 'Sem nome',
          servico: (lead.services as any)?.name || 'Sem serviço',
          origem: lead.source || 'Não informada',
          status: (lead.pipeline_stages as any)?.name || 'Novo',
          valorPotencial: lead.potential_value != null ? Number(lead.potential_value) : 0,
        }));

        setLeads(mappedLeads);
        setStages((stagesRes.data ?? []) as Stage[]);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const matchesSearch = (lead: Lead) => {
    const query = searchQuery.toLowerCase();
    return (
      lead.nome.toLowerCase().includes(query) ||
      lead.servico.toLowerCase().includes(query) ||
      lead.origem.toLowerCase().includes(query)
    );
  };

  const visibleLeads = leads.filter(matchesSearch);

  const filteredLeads = visibleLeads.filter(
    lead => statusFilter === 'Todos os status' || lead.status === statusFilter
  );

  const moveLead = async (lead: Lead, targetStageId: string) => {
    if (lead.stageId === targetStageId) return;

    const targetStage = stages.find(stage => stage.id === targetStageId);
    if (!targetStage) return;

    setKanbanFeedback(null);
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      // 1. Update the stage of this lead only
      const { error: updateError } = await supabase
        .from('leads')
        .update({ stage_id: targetStageId })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      // 2. Create activity
      const { error: actError } = await supabase
        .from('activities')
        .insert({
          organization_id: lead.organizationId,
          lead_id: lead.id,
          actor_user_id: user?.id,
          type: 'status_changed',
          data: { from: lead.stageName, to: targetStage.name },
        });

      if (actError) throw actError;

      // 3. Update local state only after both operations succeed
      setLeads(prev =>
        prev.map(item =>
          item.id === lead.id
            ? { ...item, stageId: targetStageId, stageName: targetStage.name, status: targetStage.name }
            : item
        )
      );
    } catch (err) {
      console.error('Error moving lead:', err);
      setKanbanFeedback({ ok: false, text: 'Não foi possível mover o lead.' });
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Leads</h1>
          <p className={styles.subtitle}>Gerencie todas as oportunidades recebidas.</p>
        </div>

        <button className={styles.button} onClick={() => router.push('/painel/leads/novo')}>+ Novo lead</button>
      </header>

      {loading ? (
        <div className={styles.loading}>Carregando leads...</div>
      ) : error ? (
        <div className={styles.loading}>Falha ao carregar os leads. Tente novamente mais tarde.</div>
      ) : leads.length === 0 ? (
        <div className={styles.loading}>Nenhum lead cadastrado ainda.</div>
      ) : (
        <>
          <div className={styles.filters}>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={view === 'lista' ? styles.active : ''}
                onClick={() => setView('lista')}
              >
                Lista
              </button>
              <button
                type="button"
                className={view === 'funil' ? styles.active : ''}
                onClick={() => setView('funil')}
              >
                Funil
              </button>
            </div>

            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar lead..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            {view === 'lista' && (
              <select
                className={styles.statusFilter}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option>Todos os status</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.name}>{stage.name}</option>
                ))}
              </select>
            )}
          </div>

          {view === 'lista' ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Origem</th>
                    <th>Status</th>
                    <th>Valor potencial</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={styles.tableRow}
                      onClick={() => router.push(`/painel/leads/${lead.id}`)}
                    >
                      <td className={styles.clientName}>{lead.nome}</td>
                      <td>{lead.servico}</td>
                      <td>{lead.origem}</td>
                      <td>
                        <span className={styles.statusBadge}>{lead.status}</span>
                      </td>
                      <td>{lead.valorPotencial === 0
                        ? 'A definir'
                        : formatCurrency(lead.valorPotencial)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              {kanbanFeedback && (
                <div className={`${styles.kanbanFeedback} ${kanbanFeedback.ok ? styles.feedbackOk : styles.feedbackError}`}>
                  {kanbanFeedback.text}
                </div>
              )}

              <div className={styles.kanban}>
                {stages.map(stage => {
                  const stageLeads = visibleLeads.filter(lead => lead.stageId === stage.id);
                  const stageTotal = stageLeads.reduce((acc, lead) => acc + (lead.potentialValue ?? 0), 0);

                  return (
                    <div
                      key={stage.id}
                      className={`${styles.kanbanColumn} ${dropTargetStageId === stage.id ? styles.kanbanColumnOver : ''}`}
                      onDragOver={e => {
                        e.preventDefault();
                        setDropTargetStageId(stage.id);
                      }}
                      onDragLeave={() => setDropTargetStageId(prev => (prev === stage.id ? null : prev))}
                      onDrop={e => {
                        e.preventDefault();
                        const leadId = draggingLeadId;
                        setDraggingLeadId(null);
                        setDropTargetStageId(null);
                        const lead = leads.find(item => item.id === leadId);
                        if (lead) moveLead(lead, stage.id);
                      }}
                    >
                      <div className={styles.kanbanHeader}>
                        <span className={styles.stageName}>{stage.name}</span>
                        <span className={styles.stageMeta}>
                          {stageLeads.length} {stageLeads.length === 1 ? 'lead' : 'leads'}
                        </span>
                        <span className={styles.stageMeta}>{formatCurrency(stageTotal)}</span>
                      </div>

                      <div className={styles.kanbanCards}>
                        {stageLeads.length === 0 ? (
                          <p className={styles.emptyColumn}>Nenhuma oportunidade</p>
                        ) : (
                          stageLeads.map(lead => (
                            <div
                              key={lead.id}
                              draggable
                              className={`${styles.leadCard} ${draggingLeadId === lead.id ? styles.leadCardDragging : ''}`}
                              onDragStart={() => setDraggingLeadId(lead.id)}
                              onDragEnd={() => {
                                setDraggingLeadId(null);
                                setDropTargetStageId(null);
                              }}
                              onClick={() => router.push(`/painel/leads/${lead.id}`)}
                            >
                              <p className={styles.leadCardName}>{lead.nome}</p>
                              <p className={styles.leadCardInfo}>{lead.servico}</p>
                              <p className={styles.leadCardInfo}>{lead.origem}</p>
                              <p className={styles.leadCardInfo}>Urgência: {lead.urgencia}</p>
                              <p className={styles.leadCardValue}>
                                {(lead.potentialValue ?? 0) === 0
                                  ? 'A definir'
                                  : formatCurrency(lead.potentialValue ?? 0)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}