'use client';

import styles from "./details.module.css";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LeadData {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  servico: string;
  origem: string;
  urgencia: string;
  data: string;
  valorPotencial: number;
  status: string;
  observacoes: string;
  respostas: any;
  activities: any[];
}

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);

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
            created_at,
            valor_potencial,
            notes,
            urgency,
            source,
            contacts ( name, phone, email ),
            services ( label ),
            pipeline_stages ( name ),
            form_submissions ( answers )
          `)
          .eq('id', id)
          .single();

        if (leadError || !leadData) throw leadError || new Error('Lead not found');

        // 2. Fetch stages for the pipeline
        const { data: stagesData, error: stagesError } = await supabase
          .from('pipeline_stages')
          .select('id, name')
          .eq('pipeline_id', leadData.pipeline_id);

        if (stagesError) throw stagesError;

        setStages(stagesData);

        // Map to UI format
        setLead({
          id: leadData.id,
          nome: (leadData.contacts as any)?.name || 'Sem nome',
          telefone: (leadData.contacts as any)?.phone || '',
          email: (leadData.contacts as any)?.email || '',
          servico: (leadData.services as any)?.label || 'Sem serviço',
          origem: leadData.source || 'Não informada',
          urgencia: leadData.urgency || 'Média',
          data: new Date(leadData.created_at).toLocaleDateString('pt-BR'),
          valorPotencial: leadData.valor_potencial || 0,
          status: (leadData.pipeline_stages as any)?.name || 'Novo',
          observacoes: leadData.notes || '',
          respostas: (leadData.form_submissions as any)?.[0]?.answers || {},
          activities: [], // Will fetch in next step or separate call
        });

        // 3. Fetch activities
        const { data: activitiesData, error: actError } = await supabase
          .from('activities')
          .select('*')
          .eq('lead_id', id)
          .order('created_at', { ascending: false });

        if (!actError && activitiesData) {
          setLead(prev => prev ? { ...prev, activities: activitiesData } : null);
        }

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

      // 1. Update lead stage
      const { error: updateError } = await supabase
        .from('leads')
        .update({ stage_id: stage.id })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      // 2. Create activity
      const { error: actError } = await supabase
        .from('activities')
        .insert({
          lead_id: lead.id,
          type: 'status_changed',
          data: { from: lead.status, to: newStatusName },
        });

      if (actError) throw actError;

      setLead({ ...lead, status: newStatusName });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status.');
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
          <div className={styles.infoGroup}>
            <p className={styles.label}>Serviço</p>
            <p className={styles.value}>{lead.servico}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Origem</p>
            <p className={styles.value}>{lead.origem}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Urgência</p>
            <p className={styles.value}>{lead.urgencia}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Data</p>
            <p className={styles.value}>{lead.data}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Valor Potencial</p>
            <p className={styles.value}>
              {lead.valorPotencial === 0
                ? 'A definir'
                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorPotencial)}
            </p>
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
          defaultValue={lead.observacoes}
          placeholder="Adicione notas sobre este lead..."
        />
      </section>

      <section className={`${styles.card} ${styles.fullWidth}`}>
        <h2 className={styles.cardTitle}>Histórico de Atividades</h2>
        <div className={styles.timeline}>
          {lead.activities && lead.activities.length > 0 ? (
            lead.activities.map((act: any, idx: number) => (
              <div key={idx} className={styles.timelineItem}>
                <div className={styles.dot} />
                <div className={styles.timelineContent}>
                  <p className={styles.time}>
                    {new Date(act.created_at).toLocaleString('pt-BR')}
                  </p>
                  <p>{act.type === 'lead_created' ? 'Lead criado via formulário público.' : `Status alterado para ${act.data?.to || 'outro status'}.`}</p>
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

