'use client';

import styles from "./leads.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Lead {
  id: string;
  nome: string;
  servico: string;
  origem: string;
  status: string;
  valorPotencial: number;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os status');

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('leads')
          .select(`
            id,
            source,
            valor_potencial,
            contacts ( name ),
            services ( label ),
            pipeline_stages ( name )
          `);

        if (error) throw error;

        const mappedLeads: Lead[] = data.map(lead => ({
          id: lead.id,
          nome: (lead.contacts as any)?.name || 'Sem nome',
          servico: (lead.services as any)?.label || 'Sem serviço',
          origem: lead.source || 'Não informada',
          status: (lead.pipeline_stages as any)?.name || 'Novo',
          valorPotencial: lead.valor_potencial || 0,
        }));

        setLeads(mappedLeads);
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.servico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.origem.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'Todos os status' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Leads</h1>
          <p className={styles.subtitle}>Gerencie todas as oportunidades recebidas.</p>
        </div>

        <button className={styles.button} onClick={() => router.push('/formulario/demo')}>+ Novo lead</button>
      </header>

      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar lead..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <select
          className={styles.statusFilter}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option>Todos os status</option>
          <option>Novo</option>
          <option>Qualificado</option>
          <option>Orçamento</option>
          <option>Negociação</option>
          <option>Fechado</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Carregando leads...</div>
        ) : (
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
                    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorPotencial)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}


