import styles from "./painel.module.css";
import { MOCK_LEADS, LeadStatus } from "@/lib/mocks";

export default function PainelPage() {
  const today = new Date().toISOString().split('T')[0];

  const leadsHoje = MOCK_LEADS.filter(l => l.data === today).length;
  const novosLeads = MOCK_LEADS.filter(l => l.status === 'Novo').length;
  const emNegociacao = MOCK_LEADS.filter(l => ['Orçamento', 'Negociação'].includes(l.status)).length;
  const fechados = MOCK_LEADS.filter(l => l.status === 'Fechado').length;
  const valorPotencial = MOCK_LEADS.reduce((acc, l) => acc + l.valorPotencial, 0);

  const pipelineStats = (status: LeadStatus) =>
    MOCK_LEADS.filter(l => l.status === status).length;

  const recentLeads = [...MOCK_LEADS].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>LeadFlow</p>
          <h1 className={styles.title}>Visão Geral</h1>
        </div>

        <button className={styles.button}>+ Novo Lead</button>
      </header>

      <section className={styles.cards}>
        <article className={styles.card}>
          <p>Leads Hoje</p>
          <strong>{leadsHoje}</strong>
        </article>

        <article className={styles.card}>
          <p>Novos Leads</p>
          <strong>{novosLeads}</strong>
        </article>

        <article className={styles.card}>
          <p>Em Negociação</p>
          <strong>{emNegociacao}</strong>
        </article>

        <article className={styles.card}>
          <p>Fechados</p>
          <strong>{fechados}</strong>
        </article>

        <article className={styles.card}>
          <p>Valor Potencial</p>
          <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPotencial)}</strong>
        </article>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Pipeline Comercial</h2>

        <div className={styles.pipeline}>
          <div className={styles.pipelineItem}>
            <p>Novo</p>
            <strong>{pipelineStats('Novo')}</strong>
          </div>

          <div className={styles.pipelineItem}>
            <p>Qualificado</p>
            <strong>{pipelineStats('Qualificado')}</strong>
          </div>

          <div className={styles.pipelineItem}>
            <p>Orçamento</p>
            <strong>{pipelineStats('Orçamento')}</strong>
          </div>

          <div className={styles.pipelineItem}>
            <p>Negociação</p>
            <strong>{pipelineStats('Negociação')}</strong>
          </div>

          <div className={styles.pipelineItem}>
            <p>Fechado</p>
            <strong>{pipelineStats('Fechado')}</strong>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Leads Recentes</h2>

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
                <td>{lead.nome}</td>
                <td>{lead.servico}</td>
                <td>{lead.origem}</td>
                <td>{lead.status}</td>
                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorPotencial)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
