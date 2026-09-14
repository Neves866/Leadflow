'use client';

import styles from "./painel.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";  
import { createClient } from "@/lib/supabase/client";

interface DashboardLead {
  id: string;
  created_at: string;
  source: string | null;
  potential_value: number | null;
  contacts: { name: string } | null;
  services: { name: string } | null;
  pipeline_stages: { name: string } | null;
}

export default function PainelPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('leads')
          .select(`
            id,
            created_at,
            source,
            potential_value,
            contacts ( name ),
            services ( name ),
            pipeline_stages ( name )
          `)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setLeads((data ?? []) as DashboardLead[]);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  if (loading) {
    return <div className={styles.container}>Carregando...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        Falha ao carregar os dados do painel. Tente novamente mais tarde.
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const leadStage = (lead: DashboardLead) => lead.pipeline_stages?.name || '';
  const leadsHoje = leads.filter(l => (l.created_at || '').startsWith(today)).length;
  const novosLeads = leads.filter(l => leadStage(l) === 'Novo').length;
  const emNegociacao = leads.filter(l => ['Orçamento', 'Negociação'].includes(leadStage(l))).length;
  const fechados = leads.filter(l => leadStage(l) === 'Fechado').length;
  const valorPotencial = leads.reduce((acc, l) => acc + (l.potential_value || 0), 0);

  const pipelineStats = (stage: string) =>
    leads.filter(l => leadStage(l) === stage).length;

  const recentLeads = leads.slice(0, 5).map(lead => ({
    id: lead.id,
    nome: lead.contacts?.name || 'Sem nome',
    servico: lead.services?.name || 'Sem serviço',
    origem: lead.source || 'Não informada',
    status: lead.pipeline_stages?.name || 'Novo',
    valorPotencial: lead.potential_value || 0,
  }));

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.greeting}>Bom dia 👋</p>
          <h1 className={styles.title}>Visão Geral</h1>
          <p className={styles.subtitle}>Acompanhe sua operação comercial e as oportunidades mais recentes.</p>
        </div>

        <button className={styles.button} onClick={() => router.push('/painel/leads/novo')}>
          <span className={styles.buttonIcon}>+</span> Novo Lead
        </button>
      </header>

      <section className={styles.cards}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Leads Hoje</span>
            <span className={styles.cardIcon}>📅</span>
          </div>
          <strong className={styles.cardValue}>{leadsHoje}</strong>
          <span className={styles.cardFooter}>Novas oportunidades</span>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Novos Leads</span>
            <span className={styles.cardIcon}>✨</span>
          </div>
          <strong className={styles.cardValue}>{novosLeads}</strong>
          <span className={styles.cardFooter}>Aguardando contato</span>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Em Negociação</span>
            <span className={styles.cardIcon}>⏳</span>
          </div>
          <strong className={styles.cardValue}>{emNegociacao}</strong>
          <span className={styles.cardFooter}>Pipeline ativo</span>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Fechados</span>
            <span className={styles.cardIcon}>🏆</span>
          </div>
          <strong className={styles.cardValue}>{fechados}</strong>
          <span className={styles.cardFooter}>Conversões</span>
        </article>

        <article className={`${styles.card} ${styles.cardHighlight}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Valor Potencial</span>
            <span className={styles.cardIcon}>💰</span>
          </div>
          <strong className={styles.cardValue}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPotencial)}
          </strong>
          <span className={styles.cardFooter}>Pipeline estimado</span>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Pipeline Comercial</h2>
          <div className={styles.pipelineLegend}>Progresso de Vendas</div>
        </div>

        <div className={styles.pipeline}>
          <div className={`${styles.pipelineItem} ${styles.statusNovo}`}>
            <div className={styles.pipelineStep}>
              <span className={styles.stepName}>Novo</span>
              <span className={styles.stepValue}>{pipelineStats('Novo')}</span>
            </div>
          </div>
          <div className={styles.pipelineConnector} />
          <div className={`${styles.pipelineItem} ${styles.statusQualificado}`}>
            <div className={styles.pipelineStep}>
              <span className={styles.stepName}>Qualificado</span>
              <span className={styles.stepValue}>{pipelineStats('Qualificado')}</span>
            </div>
          </div>
          <div className={styles.pipelineConnector} />
          <div className={`${styles.pipelineItem} ${styles.statusOrcamento}`}>
            <div className={styles.pipelineStep}>
              <span className={styles.stepName}>Orçamento</span>
              <span className={styles.stepValue}>{pipelineStats('Orçamento')}</span>
            </div>
          </div>
          <div className={styles.pipelineConnector} />
          <div className={`${styles.pipelineItem} ${styles.statusNegociacao}`}>
            <div className={styles.pipelineStep}>
              <span className={styles.stepName}>Negociação</span>
              <span className={styles.stepValue}>{pipelineStats('Negociação')}</span>
            </div>
          </div>
          <div className={styles.pipelineConnector} />
          <div className={`${styles.pipelineItem} ${styles.statusFechado}`}>
            <div className={styles.pipelineStep}>
              <span className={styles.stepName}>Fechado</span>
              <span className={styles.stepValue}>{pipelineStats('Fechado')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Leads Recentes</h2>
          <Link href="/painel/leads" className={styles.viewAll}>
            Ver todos <span>→</span>
          </Link>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Valor Potencial</th>
            </tr>
          </thead>

          <tbody>
            {recentLeads.map((lead) => (
              <tr key={lead.id}>
                <td className={styles.clientCell}>
                  <div className={styles.avatarSmall}>
                    {lead.nome.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span className={styles.clientName}>{lead.nome}</span>
                </td>
                <td className={styles.serviceCell}>{lead.servico}</td>
                <td>{lead.origem}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[`badge${lead.status.replace(/\s+/g, '')}`]}`}>
                    {lead.status}
                  </span>
                </td>
                <td className={styles.valueCell}>
                  {lead.valorPotencial === 0
                    ? 'A definir'
                    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorPotencial)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
